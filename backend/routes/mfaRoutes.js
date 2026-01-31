const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Setup MFA
router.post('/setup', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const secret = speakeasy.generateSecret({
            name: `Arise HRM (${req.user.email})`
        });

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Store secret temporarily or permanently? Usually permanent but enabled=false until verified
        await pool.query(
            'UPDATE user_profiles SET mfa_secret = $1 WHERE id = $2',
            [secret.base32, userId]
        );

        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl
        });

    } catch (error) {
        logger.error('MFA Setup Error', error);
        res.status(500).json({ error: 'Failed to setup MFA' });
    }
});

// Verify and Enable MFA
router.post('/enable', authenticateToken, async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT mfa_secret FROM user_profiles WHERE id = $1',
            [userId]
        );

        const user = result.rows[0];
        if (!user || !user.mfa_secret) {
            return res.status(400).json({ error: 'MFA not initialized' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            await pool.query(
                'UPDATE user_profiles SET mfa_enabled = true WHERE id = $1',
                [userId]
            );

            // Generate backup codes
            const backupCodes = Array.from({ length: 10 }, () =>
                Math.random().toString(36).substr(2, 10).toUpperCase()
            );

            await pool.query(
                'UPDATE user_profiles SET mfa_backup_codes = $1 WHERE id = $2',
                [backupCodes, userId]
            );

            logger.info('MFA Enabled', { userId });
            res.json({ success: true, backupCodes });
        } else {
            res.status(400).json({ error: 'Invalid token' });
        }

    } catch (error) {
        logger.error('MFA Enable Error', error);
        res.status(500).json({ error: 'Failed to verify MFA' });
    }
});

// Disable MFA
router.post('/disable', authenticateToken, async (req, res) => {
    try {
        // Validation could be added here (require password/token again)
        const userId = req.user.id;

        await pool.query(
            'UPDATE user_profiles SET mfa_enabled = false, mfa_secret = null, mfa_backup_codes = null WHERE id = $1',
            [userId]
        );

        logger.info('MFA Disabled', { userId });
        res.json({ success: true });

    } catch (error) {
        logger.error('MFA Disable Error', error);
        res.status(500).json({ error: 'Failed to disable MFA' });
    }
});

// Verify during login (separate from enable)
router.post('/verify-login', async (req, res) => {
    const { tempToken, token } = req.body;
    // ... verification logic ...
    // Note: This requires JWT logic adjustments. 
    // Implementing purely stateless for now: 
    // 1. JWT with 'mfa_pending' claim
    // 2. Verify token
    // 3. Issue full token

    // Placeholder implementation for route structure
    res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
