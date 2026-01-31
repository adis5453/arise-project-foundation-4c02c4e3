const { pool } = require('./backend/db');
const fs = require('fs');
const path = require('path');

async function runSchemaFixes() {
    try {
        console.log('🔧 Applying database schema fixes...');

        // Read the SQL file
        const sqlFile = path.join(__dirname, 'fix-schema-issues.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split into individual statements (basic approach)
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
                await pool.query(statement);
            }
        }

        console.log('✅ All schema fixes applied successfully!');

        // Verify fixes
        console.log('\n🔍 Verifying fixes...');

        const verifications = [
            {
                name: 'Documents table UUID types',
                query: `SELECT data_type FROM information_schema.columns
                       WHERE table_name = 'documents' AND column_name = 'uploaded_by'`
            },
            {
                name: 'Projects table department_id',
                query: `SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'projects' AND column_name = 'department_id'`
            },
            {
                name: 'Leave requests total_days',
                query: `SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'leave_requests' AND column_name = 'total_days'`
            },
            {
                name: 'Competency ratings table',
                query: `SELECT 1 FROM information_schema.tables
                       WHERE table_name = 'competency_ratings'`
            },
            {
                name: 'Attendance hours trigger',
                query: `SELECT 1 FROM information_schema.triggers
                       WHERE trigger_name = 'attendance_hours_trigger'`
            }
        ];

        for (const verification of verifications) {
            try {
                const result = await pool.query(verification.query);
                if (result.rows.length > 0) {
                    console.log(`✅ ${verification.name}: OK`);
                } else {
                    console.log(`❌ ${verification.name}: FAILED`);
                }
            } catch (error) {
                console.log(`❌ ${verification.name}: ERROR - ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error applying schema fixes:', error);
    } finally {
        await pool.end();
    }
}

runSchemaFixes();
