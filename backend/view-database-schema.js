const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hrm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});


async function viewDatabaseSchema() {
    console.log('\n🔍 DATABASE SCHEMA INSPECTION\n');
    console.log('='.repeat(80));

    try {
        // 1. List all tables
        console.log('\n📊 ALL TABLES:');
        console.log('-'.repeat(80));
        const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
        tables.rows.forEach(t => console.log(`  ✓ ${t.tablename}`));

        // 2. user_profiles columns
        console.log('\n\n👤 USER_PROFILES TABLE STRUCTURE:');
        console.log('-'.repeat(80));
        const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);

        console.log(`\nTotal Columns: ${columns.rows.length}\n`);
        columns.rows.forEach((col, idx) => {
            const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
            const type = col.character_maximum_length
                ? `${col.data_type}(${col.character_maximum_length})`
                : col.data_type;
            console.log(`${String(idx + 1).padStart(3)}. ${col.column_name.padEnd(30)} ${type.padEnd(20)} ${nullable}`);
        });

        // 3. Check for new fields
        console.log('\n\n🔍 CHECKING FOR ENHANCED FIELDS:');
        console.log('-'.repeat(80));
        const enhancedFields = [
            'pan_number', 'aadhaar_number', 'uan_number',
            'default_shift_id', 'basic_salary', 'hra',
            'bank_ifsc_code', 'middle_name', 'gender'
        ];

        for (const field of enhancedFields) {
            const exists = columns.rows.find(c => c.column_name === field);
            console.log(`  ${exists ? '✅' : '❌'} ${field.padEnd(30)} ${exists ? 'EXISTS' : 'MISSING'}`);
        }

        // 4. Check shifts table
        console.log('\n\n🕒 SHIFTS TABLE:');
        console.log('-'.repeat(80));
        const shiftsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE tablename = 'shifts'
      )
    `);

        if (shiftsExists.rows[0].exists) {
            try {
                const shifts = await pool.query('SELECT * FROM shifts ORDER BY name');
                console.log(`✅ Shifts table exists (${shifts.rows.length} shifts)\n`);
                if (shifts.rows.length > 0) {
                    shifts.rows.forEach(s => {
                        const code = s.code || 'N/A';
                        const start = s.start_time || 'N/A';
                        const end = s.end_time || 'N/A';
                        console.log(`  ${code}: ${s.name} (${start} - ${end})`);
                    });
                } else {
                    console.log('  (No shifts defined yet)');
                }
            } catch (err) {
                console.log(`✅ Shifts table exists but structure may differ: ${err.message}`);
            }
        } else {
            console.log('❌ Shifts table does NOT exist');
        }

        // 5. Summary
        console.log('\n\n📋 MIGRATION STATUS:');
        console.log('-'.repeat(80));
        const enhancedCount = enhancedFields.filter(f =>
            columns.rows.find(c => c.column_name === f)
        ).length;

        console.log(`Current Columns: ${columns.rows.length}`);
        console.log(`Enhanced Fields Present: ${enhancedCount}/${enhancedFields.length}`);
        console.log(`Migration Status: ${enhancedCount === enhancedFields.length ? '✅ COMPLETE' : `⚠️ PARTIAL (${enhancedCount}/${enhancedFields.length})`}`);

        console.log('\n' + '='.repeat(80));
        console.log('✅ Schema inspection complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

viewDatabaseSchema();
