const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hrm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function addEmployeeColumns() {
    const client = await pool.connect();

    try {
        console.log('\n🚀 Adding employee enhancement columns...\n');

        await client.query('BEGIN');

        const columns = [
            // Personal
            { name: 'middle_name', type: 'VARCHAR(100)' },
            { name: 'preferred_name', type: 'VARCHAR(100)' },
            { name: 'gender', type: 'VARCHAR(20)' },
            { name: 'marital_status', type: 'VARCHAR(20)' },
            { name: 'blood_group', type: 'VARCHAR(5)' },
            { name: 'nationality', type: 'VARCHAR(50) DEFAULT \'Indian\'' },
            { name: 'alternate_phone', type: 'VARCHAR(50)' },
            { name: 'personal_email', type: 'VARCHAR(255)' },

            // Indian Compliance
            { name: 'pan_number', type: 'VARCHAR(10) UNIQUE' },
            { name: 'aadhaar_number', type: 'VARCHAR(255)' },
            { name: 'uan_number', type: 'VARCHAR(12)' },
            { name: 'pan_aadhaar_linked', type: 'BOOLEAN DEFAULT false' },
            { name: 'pan_linked_date', type: 'DATE' },
            { name: 'esi_number', type: 'VARCHAR(17)' },
            { name: 'pf_account_number', type: 'VARCHAR(22)' },
            { name: 'previous_pf_account', type: 'VARCHAR(22)' },
            { name: 'tax_regime', type: 'VARCHAR(10) DEFAULT \'new\'' },
            { name: 'professional_tax_applicable', type: 'BOOLEAN DEFAULT true' },

            // Bank
            { name: 'bank_name', type: 'VARCHAR(100)' },
            { name: 'bank_account_number', type: 'VARCHAR(255)' },
            { name: 'bank_ifsc_code', type: 'VARCHAR(11)' },
            { name: 'bank_branch', type: 'VARCHAR(100)' },
            { name: 'account_holder_name', type: 'VARCHAR(200)' },
            { name: 'account_type', type: 'VARCHAR(20) DEFAULT \'savings\'' },
            { name: 'payment_method', type: 'VARCHAR(20) DEFAULT \'bank_transfer\'' },
            { name: 'currency_code', type: 'VARCHAR(3) DEFAULT \'INR\'' },

            // Salary
            { name: 'basic_salary', type: 'NUMERIC(10,2)' },
            { name: 'hra', type: 'NUMERIC(10,2)' },
            { name: 'special_allowance', type: 'NUMERIC(10,2)' },
            { name: 'gross_salary', type: 'NUMERIC(10,2)' },
            { name: 'net_salary', type: 'NUMERIC(10,2)' },

            // Shift
            { name: 'default_shift_id', type: 'UUID REFERENCES shifts(id)' }
        ];

        let added = 0;
        let skipped = 0;

        for (const col of columns) {
            try {
                await client.query(`
          ALTER TABLE user_profiles 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `);
                console.log(`✅ ${col.name}`);
                added++;
            } catch (err) {
                console.log(`⚠️  ${col.name} - ${err.message}`);
                skipped++;
            }
        }

        await client.query('COMMIT');

        console.log(`\n📊 Results:`);
        console.log(`   Added: ${added}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total: ${columns.length}`);

        // Verify
        const count = await client.query(`
      SELECT COUNT(*) as total 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
    `);

        console.log(`\n✅ Total user_profiles columns: ${count.rows[0].total}\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

addEmployeeColumns();
