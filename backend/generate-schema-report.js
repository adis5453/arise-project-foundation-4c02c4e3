const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hrm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function createDatabaseReport() {
    let report = [];

    try {
        // Get all columns from user_profiles
        const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);

        report.push(`DATABASE SCHEMA REPORT`);
        report.push(`Generated: ${new Date().toISOString()}`);
        report.push('');
        report.push('='.repeat(80));
        report.push('');


        report.push(`CURRENT user_profiles COLUMNS: ${columns.rows.length} total\n`);
        columns.rows.forEach((col, idx) => {
            report.push(`${String(idx + 1).padStart(3)}. ${col.column_name} `);
        });

        // Check for enhanced fields
        const enhancedFields = [
            'pan_number', 'aadhaar_number', 'uan_number', 'esi_number', 'pf_account_number',
            'bank_name', 'bank_account_number', 'bank_ifsc_code',
            'default_shift_id', 'basic_salary', 'hra', 'gross_salary', 'net_salary',
            'middle_name', 'gender', 'marital_status', 'blood_group'
        ];

        report.push(`\n\nENHANCED FIELDS STATUS: \n`);
        let foundCount = 0;
        enhancedFields.forEach(field => {
            const exists = columns.rows.find(c => c.column_name === field);
            report.push(`${exists ? '✅' : '❌'} ${field} `);
            if (exists) foundCount++;
        });

        report.push(`\n\nSUMMARY: `);
        report.push(`Current Fields: ${columns.rows.length} `);
        report.push(`Enhanced Fields Found: ${foundCount}/${enhancedFields.length}`);
        report.push(`Migration Status: ${foundCount === enhancedFields.length ? 'COMPLETE' : 'PARTIAL'}`);

        const reportText = report.join('\n');
        fs.writeFileSync('DATABASE_SCHEMA_REPORT.txt', reportText);

        console.log(reportText);
        console.log(`\n✅ Report saved to: DATABASE_SCHEMA_REPORT.txt`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

createDatabaseReport();
