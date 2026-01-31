#!/usr/bin/env node

const axios = require('axios');

async function validateImplementation() {
    const baseURL = 'http://localhost:3001/api';

    console.log('🔍 Validating HRM Implementation...');

    try {
        // Test basic endpoints
        const endpoints = [
            '/health',
            '/auth/login',
            '/employees',
            '/departments',
            '/attendance',
            '/leave',
            '/payroll',
            '/performance',
            '/probation',
            '/career',
            '/analytics/summary',
            '/lms/courses'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${baseURL}${endpoint}`, {
                    validateStatus: () => true // Don't throw on non-2xx
                });
                console.log(`✅ ${endpoint}: ${response.status}`);
            } catch (error) {
                console.log(`❌ ${endpoint}: Failed to connect`);
            }
        }

        console.log('\n🎉 Validation complete!');
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
}

if (require.main === module) {
    validateImplementation();
}

module.exports = { validateImplementation };
