const { pool } = require('./db');

async function migrate() {
    try {
        console.log('--- Starting Migration ---');

        // 1. Add employee_code column
        console.log('Adding employee_code...');
        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50) UNIQUE;
        `);

        // 2. Add profile_photo_url column
        console.log('Adding profile_photo_url...');
        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
        `);

        // 3. Backfill employee_code
        console.log('Backfilling employee codes...');
        const res = await pool.query('SELECT id FROM user_profiles WHERE employee_code IS NULL ORDER BY created_at');

        for (let i = 0; i < res.rows.length; i++) {
            const user = res.rows[i];
            const code = `EMP${String(i + 1).padStart(3, '0')}`; // EMP001, EMP002...
            await pool.query('UPDATE user_profiles SET employee_code = $1 WHERE id = $2', [code, user.id]);
            console.log(`Updated User ${user.id} -> ${code}`);
        }

        console.log('Migration Complete.');
    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        pool.end();
    }
}

migrate();
