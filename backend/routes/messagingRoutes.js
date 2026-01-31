const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Initialize Tables
const initMessagingTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                type VARCHAR(20) DEFAULT 'direct', -- direct, group
                name VARCHAR(255), -- For group chats
                description TEXT,
                avatar_url VARCHAR(500),
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS conversation_participants (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                user_id UUID REFERENCES user_profiles(id),
                role VARCHAR(20) DEFAULT 'member', -- admin, member
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_read_at TIMESTAMP,
                is_muted BOOLEAN DEFAULT FALSE,
                UNIQUE(conversation_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id UUID REFERENCES user_profiles(id),
                content TEXT NOT NULL,
                message_type VARCHAR(20) DEFAULT 'text', -- text, file, image, system
                attachment_url VARCHAR(500),
                attachment_name VARCHAR(255),
                is_edited BOOLEAN DEFAULT FALSE,
                is_deleted BOOLEAN DEFAULT FALSE,
                reply_to_id INTEGER REFERENCES messages(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        logger.info('Messaging tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize messaging tables', error);
    }
};

initMessagingTables();

// Routes

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, 
                   cp.last_read_at,
                   cp.is_muted,
                   (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')) as unread_count
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = $1
            ORDER BY last_message_at DESC NULLS LAST
        `, [req.user.id]);

        // Get participants for each conversation
        for (let conv of result.rows) {
            const participants = await pool.query(`
                SELECT u.id, u.first_name, u.last_name, u.avatar_url
                FROM conversation_participants cp
                JOIN user_profiles u ON cp.user_id = u.id
                WHERE cp.conversation_id = $1
            `, [conv.id]);
            conv.participants = participants.rows;
        }

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching conversations', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get conversation messages
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { limit = 50, before_id } = req.query;

    try {
        // Verify user is participant
        const participant = await pool.query(
            'SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        if (participant.rows.length === 0) {
            return res.status(403).json({ error: 'Not a participant' });
        }

        let query = `
            SELECT m.*, 
                   u.first_name || ' ' || u.last_name as sender_name,
                   u.avatar_url as sender_avatar
            FROM messages m
            JOIN user_profiles u ON m.sender_id = u.id
            WHERE m.conversation_id = $1 AND m.is_deleted = false
        `;
        const params = [id];

        if (before_id) {
            query += ` AND m.id < $2`;
            params.push(before_id);
        }

        query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit || '50'));

        const result = await pool.query(query, params);

        // Update last read
        await pool.query(
            'UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        res.json(result.rows.reverse()); // Return in ascending order
    } catch (error) {
        logger.error('Error fetching messages', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create/Start conversation
router.post('/conversations', authenticateToken, async (req, res) => {
    const { type = 'direct', name, participant_ids, description } = req.body;

    if (!participant_ids || participant_ids.length === 0) {
        return res.status(400).json({ error: 'Participant IDs required' });
    }

    try {
        // For direct messages, check if conversation already exists
        if (type === 'direct' && participant_ids.length === 1) {
            const existing = await pool.query(`
                SELECT c.id FROM conversations c
                JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = $1
                JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = $2
                WHERE c.type = 'direct'
            `, [req.user.id, participant_ids[0]]);

            if (existing.rows.length > 0) {
                return res.json({ id: existing.rows[0].id, existing: true });
            }
        }

        // Create conversation
        const convResult = await pool.query(`
            INSERT INTO conversations (type, name, description, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [type, name, description, req.user.id]);

        const conversationId = convResult.rows[0].id;

        // Add creator and participants
        const allParticipants = [req.user.id, ...participant_ids];
        for (const userId of allParticipants) {
            await pool.query(`
                INSERT INTO conversation_participants (conversation_id, user_id, role)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING
            `, [conversationId, userId, userId === req.user.id ? 'admin' : 'member']);
        }

        logger.info('Conversation created', { id: conversationId, type });
        res.status(201).json(convResult.rows[0]);
    } catch (error) {
        logger.error('Error creating conversation', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Send message
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { content, message_type = 'text', attachment_url, attachment_name, reply_to_id } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        // Verify user is participant
        const participant = await pool.query(
            'SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        if (participant.rows.length === 0) {
            return res.status(403).json({ error: 'Not a participant' });
        }

        const result = await pool.query(`
            INSERT INTO messages (
                conversation_id, sender_id, content, message_type, 
                attachment_url, attachment_name, reply_to_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [id, req.user.id, content, message_type, attachment_url, attachment_name, reply_to_id]);

        // Update conversation timestamp
        await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [id]);

        // Update sender's last_read
        await pool.query(
            'UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        // Get full message with sender info
        const fullMessage = await pool.query(`
            SELECT m.*, u.first_name || ' ' || u.last_name as sender_name, u.avatar_url as sender_avatar
            FROM messages m
            JOIN user_profiles u ON m.sender_id = u.id
            WHERE m.id = $1
        `, [result.rows[0].id]);

        res.status(201).json(fullMessage.rows[0]);
    } catch (error) {
        logger.error('Error sending message', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Delete message (soft delete)
router.delete('/messages/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            UPDATE messages SET is_deleted = true, updated_at = NOW()
            WHERE id = $1 AND sender_id = $2
            RETURNING id
        `, [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found or not authorized' });
        }

        res.json({ message: 'Message deleted' });
    } catch (error) {
        logger.error('Error deleting message', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get messaging stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM conversation_participants WHERE user_id = $1) as total_conversations,
                (SELECT COUNT(*) FROM messages WHERE sender_id = $1) as messages_sent,
                (SELECT SUM(
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'))
                ) FROM conversations c
                JOIN conversation_participants cp ON c.id = cp.conversation_id
                WHERE cp.user_id = $1) as total_unread
        `, [req.user.id]);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching messaging stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get contacts for compose (all users except current)
router.get('/contacts', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, first_name, last_name, email, avatar_url, role_name as role
            FROM user_profiles u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id != $1 AND u.is_active = true
            ORDER BY first_name, last_name
        `, [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching contacts', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
