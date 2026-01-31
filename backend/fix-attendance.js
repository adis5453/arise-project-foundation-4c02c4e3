const { pool } = require('./db');

async function fixAttendance() {
    try {
        const client = await pool.connect();

        // Get a valid employee ID (assuming single user or main user)
        const userRes = await client.query("SELECT id, first_name FROM user_profiles LIMIT 1");
        if (userRes.rows.length === 0) {
            console.log("No users found to assign record to.");
            return;
        }
        const userId = userRes.rows[0].id;
        console.log(`Using Employee ID: ${userId} (${userRes.rows[0].first_name})`);

        // Find the broken record
        const brokenRes = await client.query("SELECT id FROM attendance_records WHERE employee_id IS NULL AND check_out IS NULL");

        if (brokenRes.rows.length > 0) {
            const recordId = brokenRes.rows[0].id;
            console.log(`Found broken record: ${recordId}`);

            // Fix it: Set employee_id AND ensure date is today so clock-out works
            await client.query(`
                UPDATE attendance_records 
                SET employee_id = $1, date = CURRENT_DATE
                WHERE id = $2
            `, [userId, recordId]);
            console.log("Record fixed! (Updated employee_id and date)");
        } else {
            console.log("No broken records (employee_id IS NULL) found.");
        }

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

fixAttendance();
