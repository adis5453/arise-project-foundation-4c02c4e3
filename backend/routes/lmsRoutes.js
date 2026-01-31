const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// ========================================
// LEARNING MANAGEMENT SYSTEM (LMS) ROUTES
// ========================================

// Get all courses
router.get('/courses', authenticateToken, async (req, res) => {
    try {
        const { category, instructor_id, is_active } = req.query;

        let query = `
            SELECT c.*,
                   u.first_name || ' ' || u.last_name as instructor_name,
                   (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.status = 'completed') as completed_count,
                   (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.status = 'enrolled') as enrolled_count
            FROM courses c
            LEFT JOIN user_profiles u ON c.instructor_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ` AND c.category = $${params.length + 1}`;
            params.push(category);
        }

        if (instructor_id) {
            query += ` AND c.instructor_id = $${params.length + 1}`;
            params.push(instructor_id);
        }

        if (is_active !== undefined) {
            query += ` AND c.is_active = $${params.length + 1}`;
            params.push(is_active === 'true');
        }

        query += ' ORDER BY c.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching courses', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get course by ID
router.get('/courses/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT c.*,
                   u.first_name || ' ' || u.last_name as instructor_name,
                   (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as total_enrollments,
                   (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.status = 'completed') as completed_count,
                   (SELECT AVG(ce.score) FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.score IS NOT NULL) as avg_score
            FROM courses c
            LEFT JOIN user_profiles u ON c.instructor_id = u.id
            WHERE c.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching course', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create course
router.post('/courses', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            duration_hours,
            instructor_id,
            content,
            prerequisites,
            skills_covered,
            is_active
        } = req.body;

        const result = await pool.query(`
            INSERT INTO courses
            (title, description, category, duration_hours, instructor_id, content, prerequisites, skills_covered, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            title,
            description,
            category,
            duration_hours,
            instructor_id,
            content || [],
            prerequisites || [],
            skills_covered || [],
            is_active !== undefined ? is_active : true
        ]);

        logger.info('Course created', { courseId: result.rows[0].id, title });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating course', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update course
router.put('/courses/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            category,
            duration_hours,
            instructor_id,
            content,
            prerequisites,
            skills_covered,
            is_active
        } = req.body;

        const result = await pool.query(`
            UPDATE courses
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                duration_hours = COALESCE($4, duration_hours),
                instructor_id = COALESCE($5, instructor_id),
                content = COALESCE($6, content),
                prerequisites = COALESCE($7, prerequisites),
                skills_covered = COALESCE($8, skills_covered),
                is_active = COALESCE($9, is_active),
                updated_at = NOW()
            WHERE id = $10
            RETURNING *
        `, [
            title, description, category, duration_hours, instructor_id,
            content, prerequisites, skills_covered, is_active, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating course', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Delete course
router.delete('/courses/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        // Check if course has enrollments
        const enrollments = await pool.query(
            'SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = $1',
            [req.params.id]
        );

        if (enrollments.rows[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete course with existing enrollments' });
        }

        const result = await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        logger.error('Error deleting course', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Enroll employee in course
router.post('/enrollments', authenticateToken, async (req, res) => {
    try {
        const { course_id, employee_id } = req.body;

        // Check if already enrolled
        const existing = await pool.query(
            'SELECT id FROM course_enrollments WHERE course_id = $1 AND employee_id = $2',
            [course_id, employee_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Employee already enrolled in this course' });
        }

        const result = await pool.query(`
            INSERT INTO course_enrollments
            (course_id, employee_id)
            VALUES ($1, $2)
            RETURNING *
        `, [course_id, employee_id]);

        logger.info('Employee enrolled in course', { courseId: course_id, employeeId: employee_id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error enrolling employee', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get employee enrollments
router.get('/enrollments/employee/:employeeId', authenticateToken, async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Check access permission
        const userRole = req.user.role?.toLowerCase();
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole) && req.user.id !== employeeId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(`
            SELECT ce.*,
                   c.title, c.description, c.category, c.duration_hours,
                   u.first_name || ' ' || u.last_name as instructor_name
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            LEFT JOIN user_profiles u ON c.instructor_id = u.id
            WHERE ce.employee_id = $1
            ORDER BY ce.enrollment_date DESC
        `, [employeeId]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching employee enrollments', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update enrollment progress
router.put('/enrollments/:id/progress', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { progress_percentage } = req.body;

        // Verify ownership
        const enrollment = await pool.query(
            'SELECT employee_id FROM course_enrollments WHERE id = $1',
            [id]
        );

        if (enrollment.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        const userRole = req.user.role?.toLowerCase();
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole) &&
            enrollment.rows[0].employee_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(`
            UPDATE course_enrollments
            SET progress_percentage = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [progress_percentage, id]);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating enrollment progress', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Complete course enrollment
router.post('/enrollments/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { score, certificate_issued } = req.body;

        // Verify ownership
        const enrollment = await pool.query(
            'SELECT employee_id, course_id FROM course_enrollments WHERE id = $1',
            [id]
        );

        if (enrollment.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        const userRole = req.user.role?.toLowerCase();
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole) &&
            enrollment.rows[0].employee_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(`
            UPDATE course_enrollments
            SET completion_date = CURRENT_DATE,
                status = 'completed',
                score = $1,
                certificate_issued = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [score, certificate_issued || false, id]);

        // Auto-issue certificate if score >= 70%
        if (score >= 70 && !certificate_issued) {
            await pool.query(`
                UPDATE course_enrollments
                SET certificate_issued = true
                WHERE id = $1
            `, [id]);
        }

        logger.info('Course completed', {
            enrollmentId: id,
            employeeId: enrollment.rows[0].employee_id,
            courseId: enrollment.rows[0].course_id,
            score
        });

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error completing course', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get certifications
router.get('/certifications', authenticateToken, async (req, res) => {
    try {
        const { employee_id, status } = req.query;

        let query = `
            SELECT c.*,
                   u.first_name || ' ' || u.last_name as employee_name,
                   u.employee_id as employee_code
            FROM certifications c
            JOIN user_profiles u ON c.employee_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Non-admins can only see their own certifications
        const userRole = req.user.role?.toLowerCase();
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            query += ` AND c.employee_id = $${params.length + 1}`;
            params.push(req.user.id);
        }

        if (employee_id) {
            query += ` AND c.employee_id = $${params.length + 1}`;
            params.push(employee_id);
        }

        if (status) {
            query += ` AND c.status = $${params.length + 1}`;
            params.push(status);
        }

        query += ' ORDER BY c.issue_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching certifications', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Add certification
router.post('/certifications', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const {
            employee_id,
            certification_name,
            issuing_authority,
            issue_date,
            expiry_date,
            credential_id,
            status
        } = req.body;

        const result = await pool.query(`
            INSERT INTO certifications
            (employee_id, certification_name, issuing_authority, issue_date, expiry_date, credential_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            employee_id,
            certification_name,
            issuing_authority,
            issue_date,
            expiry_date,
            credential_id,
            status || 'active'
        ]);

        logger.info('Certification added', {
            certificationId: result.rows[0].id,
            employeeId: employee_id,
            certificationName: certification_name
        });

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error adding certification', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update certification
router.put('/certifications/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { certification_name, issuing_authority, issue_date, expiry_date, credential_id, status } = req.body;

        const result = await pool.query(`
            UPDATE certifications
            SET certification_name = COALESCE($1, certification_name),
                issuing_authority = COALESCE($2, issuing_authority),
                issue_date = COALESCE($3, issue_date),
                expiry_date = COALESCE($4, expiry_date),
                credential_id = COALESCE($5, credential_id),
                status = COALESCE($6, status),
                updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `, [certification_name, issuing_authority, issue_date, expiry_date, credential_id, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certification not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating certification', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get LMS statistics
router.get('/stats/summary', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM courses WHERE is_active = true) as active_courses,
                (SELECT COUNT(*) FROM course_enrollments WHERE status = 'enrolled') as active_enrollments,
                (SELECT COUNT(*) FROM course_enrollments WHERE status = 'completed') as completed_enrollments,
                (SELECT COUNT(*) FROM certifications WHERE status = 'active') as active_certifications,
                (SELECT COUNT(*) FROM certifications WHERE expiry_date < CURRENT_DATE + INTERVAL '30 days' AND expiry_date > CURRENT_DATE) as expiring_certifications,
                (SELECT ROUND(AVG(score), 2) FROM course_enrollments WHERE score IS NOT NULL) as avg_course_score
        `);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching LMS stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get course categories
router.get('/courses/categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT category, COUNT(*) as course_count
            FROM courses
            WHERE is_active = true
            GROUP BY category
            ORDER BY category
        `);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching course categories', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
