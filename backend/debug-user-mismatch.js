const { pool } = require('./db');

async function debugMismatch() {
    try {
        const client = await pool.connect();

        console.log("--- All User Profiles ---");
        const users = await client.query("SELECT id, first_name, last_name, email FROM user_profiles");
        console.table(users.rows);

        console.log("\n--- Active Attendance Records (check_out IS NULL) ---");
        const active = await client.query(`
            SELECT a.id, a.employee_id, a.date, a.check_in, u.first_name 
            FROM attendance_records a
            LEFT JOIN user_profiles u ON a.employee_id = u.id
            WHERE a.check_out IS NULL
        `);
        console.table(active.rows);

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

debugMismatch();
