const { pool } = require('./db');

async function debugAttendance() {
    try {
        const client = await pool.connect();

        console.log("--- DB Time Info ---");
        const timeRes = await client.query("SELECT NOW() as db_now, CURRENT_DATE as db_date, CURRENT_TIMESTAMP as db_timestamp");
        console.log(JSON.stringify(timeRes.rows[0], null, 2));

        console.log("--- Latest 5 Attendance Records ---");
        const res = await client.query(`
            SELECT id, employee_id, date, check_in, check_out, status, created_at
            FROM attendance_records 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log(JSON.stringify(res.rows, null, 2));

        console.log("--- Active Records (check_out IS NULL) ---");
        const active = await client.query(`
            SELECT id, employee_id, date, check_in 
            FROM attendance_records 
            WHERE check_out IS NULL
        `);
        console.log(JSON.stringify(active.rows, null, 2));

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

debugAttendance();
