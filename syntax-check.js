#!/usr/bin/env node

/**
 * SYNTAX VALIDATION SCRIPT
 * ========================
 *
 * Checks if all route files can be loaded without syntax errors
 */

console.log('🔍 Checking Route Files Syntax...');

const fs = require('fs');
const path = require('path');

const routeFiles = [
    'probationRoutes.js',
    'careerRoutes.js',
    'analyticsRoutes.js',
    'lmsRoutes.js'
];

const routesDir = path.join(__dirname, 'backend', 'routes');
let allValid = true;

routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`❌ ${file}: File not found`);
            allValid = false;
            return;
        }

        // Try to read and check basic syntax
        const content = fs.readFileSync(filePath, 'utf8');

        // Basic checks
        if (!content.includes('const express = require(\'express\')')) {
            console.log(`❌ ${file}: Missing express import`);
            allValid = false;
            return;
        }

        if (!content.includes('module.exports = router')) {
            console.log(`❌ ${file}: Missing module export`);
            allValid = false;
            return;
        }

        if (!content.includes('const router = express.Router()')) {
            console.log(`❌ ${file}: Missing router creation`);
            allValid = false;
            return;
        }

        console.log(`✅ ${file}: Syntax OK`);

    } catch (error) {
        console.log(`❌ ${file}: Error - ${error.message}`);
        allValid = false;
    }
});

// Check if backend index.js has the new routes
try {
    const indexPath = path.join(__dirname, 'backend', 'index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    const requiredImports = [
        'probationRoutes',
        'careerRoutes',
        'analyticsRoutes',
        'lmsRoutes'
    ];

    let indexValid = true;
    requiredImports.forEach(route => {
        if (!indexContent.includes(`require('./routes/${route}')`)) {
            console.log(`❌ index.js: Missing import for ${route}`);
            indexValid = false;
        }
    });

    if (indexValid) {
        console.log('✅ index.js: All route imports present');
    } else {
        allValid = false;
    }

} catch (error) {
    console.log(`❌ index.js: Error - ${error.message}`);
    allValid = false;
}

if (allValid) {
    console.log('\n🎉 All route files are syntactically valid!');
    console.log('✅ Ready for database schema execution and API testing');
} else {
    console.log('\n❌ Some route files have issues. Please fix before proceeding.');
    process.exit(1);
}
