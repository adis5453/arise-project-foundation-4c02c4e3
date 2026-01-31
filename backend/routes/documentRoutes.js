const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Table
const initDocumentTable = async () => {
    try {
        // First, check if table exists with wrong column types and fix them
        const tableExists = await pool.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'documents'
        `);

        if (tableExists.rows.length > 0) {
            // Check column types and fix if necessary
            const columns = await pool.query(`
                SELECT column_name, data_type FROM information_schema.columns
                WHERE table_name = 'documents' AND column_name IN ('uploaded_by', 'employee_id')
            `);

            for (const col of columns.rows) {
                if (col.data_type !== 'uuid') {
                    // Drop existing foreign key constraints
                    await pool.query(`ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_${col.column_name}_fkey`);

                    // Change column type
                    await pool.query(`ALTER TABLE documents ALTER COLUMN ${col.column_name} TYPE UUID USING ${col.column_name}::text::uuid`);

                    // Add correct foreign key constraint
                    await pool.query(`ALTER TABLE documents ADD CONSTRAINT documents_${col.column_name}_fkey FOREIGN KEY (${col.column_name}) REFERENCES user_profiles(id)`);
                }
            }
        } else {
            // Create table with correct types
            await pool.query(`
                CREATE TABLE documents (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(50) DEFAULT 'file', -- 'file' or 'folder'
                    extension VARCHAR(10),
                    size INTEGER,
                    mime_type VARCHAR(100),
                    path VARCHAR(500) DEFAULT '/',
                    file_url VARCHAR(500),
                    uploaded_by UUID REFERENCES user_profiles(id),
                    employee_id UUID REFERENCES user_profiles(id), -- Owner/Target
                    is_shared BOOLEAN DEFAULT FALSE,
                    is_starred BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        }
        logger.info('Documents table verified/created');
    } catch (error) {
        logger.error('Failed to initialize documents table', error);
    }
};

initDocumentTable();

// Routes

// List Documents
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Simple list for now. In real app, handle folders/paths.
        const result = await pool.query(`
            SELECT d.*, u.first_name || ' ' || u.last_name as uploader_name
            FROM documents d
            LEFT JOIN user_profiles u ON d.uploaded_by = u.id
            ORDER BY d.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload Document
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, path: docPath, employeeId } = req.body;
    const stats = fs.statSync(req.file.path);

    try {
        const result = await pool.query(`
            INSERT INTO documents (
                name, type, extension, size, mime_type, path, file_url, uploaded_by, employee_id
            ) VALUES ($1, 'file', $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            name || req.file.originalname,
            path.extname(req.file.originalname).substring(1),
            stats.size,
            req.file.mimetype,
            docPath || '/',
            req.file.filename, // Store filename, serve via static middleware
            req.user.id,
            employeeId || req.user.id
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        // Cleanup file if DB insert fails
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message });
    }
});

// Delete Document
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Get file info first
        const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
        if (docResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const doc = docResult.rows[0];

        // Delete from DB
        await pool.query('DELETE FROM documents WHERE id = $1', [id]);

        // Delete from FS
        const filePath = path.join(uploadDir, doc.file_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
