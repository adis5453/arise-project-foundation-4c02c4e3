const { pool } = require('./db');

async function checkOpenSession() {
    try {
        const client = await pool.connect();

        // Find Mansi
        const mansiRes = await client.query("SELECT id, first_name FROM user_profiles WHERE first_name = 'Mansi' LIMIT 1");
        if (mansiRes.rows.length === 0) {
            console.log("Mansi not found.");
            return;
        }
        const mansi = mansiRes.rows[0];
        console.log(`Checking records for: ${mansi.first_name} (${mansi.id})`);

        // Get her records
        const records = await client.query(`
            SELECT id, date, check_in, check_out, status 
            FROM attendance_records 
            WHERE employee_id = $1 
            ORDER BY created_at DESC 
            LIMIT 5
        `, [mansi.id]);

        console.table(records.rows);

        // Explicit check for open session
        const open = records.rows.find(r => r.check_out === null);
        if (open) {
            console.log("OPEN SESSION FOUND:", open.id);
        } else {
            console.log("NO OPEN SESSION FOUND. User is effectively clocked out.");
        }

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

checkOpenSession();
