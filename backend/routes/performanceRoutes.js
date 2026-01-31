const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole, getAccessScope, SCOPES } = require('../middleware/roles');
const logger = require('../utils/logger');

// ========================================
// Self-Healing Schema Initialization
// ========================================
const initPerformanceTables = async () => {
    try {
        // Performance Reviews Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS performance_reviews (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                reviewer_id UUID REFERENCES user_profiles(id),
                review_period_start DATE NOT NULL,
                review_period_end DATE NOT NULL,
                overall_rating DECIMAL(3,2) CHECK (overall_rating >= 1 AND overall_rating <= 5),
                strengths TEXT,
                areas_for_improvement TEXT,
                goals_achieved TEXT,
                comments TEXT,
                status VARCHAR(50) DEFAULT 'draft', -- draft, pending_review, completed
                submitted_at TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Fix: Ensure created_at column exists (fixing "column pr.created_at does not exist" error)
        try {
            await pool.query(`
                ALTER TABLE performance_reviews 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft'
            `);
        } catch (e) {
            logger.warn('Failed to add columns to performance_reviews', { error: e.message });
        }

        // Performance Goals Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS performance_goals (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                target_date DATE,
                category VARCHAR(100), -- professional, personal, team, company
                priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
                progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
                status VARCHAR(50) DEFAULT 'in_progress', -- not_started, in_progress, completed, cancelled
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add missing columns if table existed with old schema
        await pool.query(`
            ALTER TABLE performance_goals
            ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES user_profiles(id)
        `).catch(() => { });

        // Competency Ratings Table - Handle foreign key issues gracefully
        try {
            // Check if table exists with wrong structure
            const tableExists = await pool.query(`
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'competency_ratings'
            `);

            if (tableExists.rows.length > 0) {
                // Check if review_id column has wrong type
                const columnInfo = await pool.query(`
                    SELECT data_type FROM information_schema.columns
                    WHERE table_name = 'competency_ratings' AND column_name = 'review_id'
                `);

                if (columnInfo.rows.length > 0 && columnInfo.rows[0].data_type !== 'integer') {
                    // Drop and recreate with correct type
                    await pool.query(`DROP TABLE competency_ratings CASCADE`);
                    await pool.query(`
                        CREATE TABLE competency_ratings (
                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            review_id INTEGER REFERENCES performance_reviews(id) ON DELETE CASCADE,
                            competency_id UUID,
                            competency_name VARCHAR(255) NOT NULL,
                            rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 5),
                            comments TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                }
            } else {
                // Create table if it doesn't exist
                await pool.query(`
                    CREATE TABLE competency_ratings (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        review_id INTEGER REFERENCES performance_reviews(id) ON DELETE CASCADE,
                        competency_id UUID,
                        competency_name VARCHAR(255) NOT NULL,
                        rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 5),
                        comments TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
            }
        } catch (fkError) {
            // If foreign key constraint fails, try without it and log
            logger.warn('Foreign key constraint failed for competency_ratings, creating without FK', { error: fkError.message });
            await pool.query(`
                CREATE TABLE IF NOT EXISTS competency_ratings (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    review_id INTEGER,
                    competency_id UUID,
                    competency_name VARCHAR(255) NOT NULL,
                    rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 5),
                    comments TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }

        logger.info('Performance module tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize performance tables', { error: error.message });
    }
};

// Run initialization
initPerformanceTables();

// ========================================
// PERFORMANCE REVIEWS ROUTES
// ========================================

// Get all reviews (filtered by role scope)
router.get('/reviews', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role?.toLowerCase();
        const { employee_id, status, year } = req.query;

        let query = `
            SELECT pr.*, 
                   e.first_name || ' ' || e.last_name as employee_name,
                   e.employee_id as employee_code,
                   r.first_name || ' ' || r.last_name as reviewer_name,
                   d.name as department_name
            FROM performance_reviews pr
            LEFT JOIN user_profiles e ON pr.employee_id = e.id
            LEFT JOIN user_profiles r ON pr.reviewer_id = r.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE 1=1
        `;
        const params = [];

        // Scope-based filtering
        if (['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            // Can see all reviews
        } else if (['department_manager', 'manager'].includes(userRole)) {
            // Can see department reviews
            query += ` AND e.department_id = (SELECT department_id FROM user_profiles WHERE id = $${params.length + 1})`;
            params.push(userId);
        } else {
            // Can only see own reviews
            query += ` AND pr.employee_id = $${params.length + 1}`;
            params.push(userId);
        }

        if (employee_id) {
            query += ` AND pr.employee_id = $${params.length + 1}`;
            params.push(employee_id);
        }

        if (status) {
            query += ` AND pr.status = $${params.length + 1}`;
            params.push(status);
        }

        if (year) {
            query += ` AND EXTRACT(YEAR FROM pr.review_period_start) = $${params.length + 1}`;
            params.push(year);
        }

        query += ' ORDER BY pr.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching performance reviews', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get single review
router.get('/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT pr.*, 
                   e.first_name || ' ' || e.last_name as employee_name,
                   r.first_name || ' ' || r.last_name as reviewer_name
            FROM performance_reviews pr
            LEFT JOIN user_profiles e ON pr.employee_id = e.id
            LEFT JOIN user_profiles r ON pr.reviewer_id = r.id
            WHERE pr.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Get competency ratings for this review
        const ratingsResult = await pool.query(
            'SELECT * FROM competency_ratings WHERE review_id = $1',
            [id]
        );

        const review = result.rows[0];
        review.competency_ratings = ratingsResult.rows;

        res.json(review);
    } catch (error) {
        logger.error('Error fetching review', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create review
router.post('/reviews', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin', 'department_manager', 'manager']), async (req, res) => {
    try {
        const {
            employee_id,
            review_period_start,
            review_period_end,
            overall_rating,
            strengths,
            areas_for_improvement,
            goals_achieved,
            comments,
            competency_ratings
        } = req.body;

        const reviewerId = req.user.id;

        const result = await pool.query(`
            INSERT INTO performance_reviews 
            (employee_id, reviewer_id, review_period_start, review_period_end, 
             overall_rating, strengths, areas_for_improvement, goals_achieved, comments, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
            RETURNING *
        `, [employee_id, reviewerId, review_period_start, review_period_end,
            overall_rating, strengths, areas_for_improvement, goals_achieved, comments]);

        const reviewId = result.rows[0].id;

        // Insert competency ratings if provided
        if (competency_ratings && competency_ratings.length > 0) {
            for (const cr of competency_ratings) {
                await pool.query(`
                    INSERT INTO competency_ratings (review_id, competency_name, rating, comments)
                    VALUES ($1, $2, $3, $4)
                `, [reviewId, cr.competency_name, cr.rating, cr.comments]);
            }
        }

        logger.info('Performance review created', { reviewId, employeeId: employee_id, reviewerId });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating review', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update review
router.put('/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            overall_rating,
            strengths,
            areas_for_improvement,
            goals_achieved,
            comments,
            status
        } = req.body;

        const result = await pool.query(`
            UPDATE performance_reviews
            SET overall_rating = COALESCE($1, overall_rating),
                strengths = COALESCE($2, strengths),
                areas_for_improvement = COALESCE($3, areas_for_improvement),
                goals_achieved = COALESCE($4, goals_achieved),
                comments = COALESCE($5, comments),
                status = COALESCE($6, status),
                submitted_at = CASE WHEN $6 = 'pending_review' THEN NOW() ELSE submitted_at END,
                completed_at = CASE WHEN $6 = 'completed' THEN NOW() ELSE completed_at END,
                updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `, [overall_rating, strengths, areas_for_improvement, goals_achieved, comments, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating review', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// GOALS ROUTES
// ========================================

// Get goals
router.get('/goals', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role?.toLowerCase();
        const { employee_id, status, category } = req.query;

        let query = `
            SELECT pg.*, 
                   e.first_name || ' ' || e.last_name as employee_name
            FROM performance_goals pg
            LEFT JOIN user_profiles e ON pg.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];

        // Scope-based filtering
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            if (employee_id && employee_id !== userId) {
                // Check if user is manager of this employee
                const isManager = await pool.query(
                    'SELECT 1 FROM user_profiles WHERE id = $1 AND manager_id = $2',
                    [employee_id, userId]
                );
                if (isManager.rows.length === 0) {
                    query += ` AND pg.employee_id = $${params.length + 1}`;
                    params.push(userId);
                }
            } else if (!employee_id) {
                query += ` AND pg.employee_id = $${params.length + 1}`;
                params.push(userId);
            }
        }

        if (employee_id) {
            query += ` AND pg.employee_id = $${params.length + 1}`;
            params.push(employee_id);
        }

        if (status) {
            query += ` AND pg.status = $${params.length + 1}`;
            params.push(status);
        }

        if (category) {
            query += ` AND pg.category = $${params.length + 1}`;
            params.push(category);
        }

        query += ' ORDER BY pg.priority DESC, pg.target_date ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching goals', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create goal
router.post('/goals', authenticateToken, async (req, res) => {
    try {
        const { employee_id, title, description, target_date, category, priority } = req.body;
        const createdBy = req.user.id;

        // If no employee_id provided, create goal for self
        const targetEmployeeId = employee_id || createdBy;

        const result = await pool.query(`
            INSERT INTO performance_goals 
            (employee_id, title, description, target_date, category, priority, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [targetEmployeeId, title, description, target_date, category || 'professional', priority || 'medium', createdBy]);

        logger.info('Goal created', { goalId: result.rows[0].id, employeeId: targetEmployeeId });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating goal', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update goal
router.put('/goals/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, target_date, category, priority, progress_percentage, status } = req.body;

        const result = await pool.query(`
            UPDATE performance_goals
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                target_date = COALESCE($3, target_date),
                category = COALESCE($4, category),
                priority = COALESCE($5, priority),
                progress_percentage = COALESCE($6, progress_percentage),
                status = COALESCE($7, status),
                completed_at = CASE WHEN $7 = 'completed' THEN NOW() ELSE completed_at END,
                updated_at = NOW()
            WHERE id = $8
            RETURNING *
        `, [title, description, target_date, category, priority, progress_percentage, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating goal', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Delete goal
router.delete('/goals/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM performance_goals WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({ success: true, message: 'Goal deleted' });
    } catch (error) {
        logger.error('Error deleting goal', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// STATS ROUTES
// ========================================

// Get performance stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role?.toLowerCase();

        let statsQuery;
        let params = [];

        if (['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM performance_reviews WHERE status = 'completed') as completed_reviews,
                    (SELECT COUNT(*) FROM performance_reviews WHERE status = 'pending_review') as pending_reviews,
                    (SELECT AVG(overall_rating) FROM performance_reviews WHERE status = 'completed') as avg_rating,
                    (SELECT COUNT(*) FROM performance_goals WHERE status = 'completed') as goals_completed,
                    (SELECT COUNT(*) FROM performance_goals WHERE status = 'in_progress') as goals_in_progress,
                    (SELECT COUNT(*) FROM performance_goals) as total_goals
            `;
        } else {
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM performance_reviews WHERE employee_id = $1 AND status = 'completed') as completed_reviews,
                    (SELECT AVG(overall_rating) FROM performance_reviews WHERE employee_id = $1 AND status = 'completed') as avg_rating,
                    (SELECT COUNT(*) FROM performance_goals WHERE employee_id = $1 AND status = 'completed') as goals_completed,
                    (SELECT COUNT(*) FROM performance_goals WHERE employee_id = $1 AND status = 'in_progress') as goals_in_progress,
                    (SELECT COUNT(*) FROM performance_goals WHERE employee_id = $1) as total_goals
            `;
            params.push(userId);
        }

        const result = await pool.query(statsQuery, params);

        const stats = result.rows[0];
        stats.avg_rating = parseFloat(stats.avg_rating) || 0;
        stats.goal_completion_rate = stats.total_goals > 0
            ? Math.round((parseInt(stats.goals_completed) / parseInt(stats.total_goals)) * 100)
            : 0;

        res.json(stats);
    } catch (error) {
        logger.error('Error fetching performance stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
