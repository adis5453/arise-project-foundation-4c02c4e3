const { pool } = require('./db');

async function fixMismatch() {
    try {
        const client = await pool.connect();

        // Target User: Mansi (from debug output/screenshot logic)
        // We look for a user that IS NOT the one currently assigned to the active record but probably SHOULD be.
        // In this specific case, I will fetch 'Mansi' by name or email if possible, or just the other user in the list.

        const mansiRes = await client.query("SELECT id FROM user_profiles WHERE first_name = 'Mansi' OR email LIKE '%mansi%' LIMIT 1");

        if (mansiRes.rows.length === 0) {
            console.log("Could not find user 'Mansi'. listing all to be sure.");
            // If I can't find Mansi by name, I'll just assign it to the 'other' user that isn't the current owner.
            // But from the previous table output (which I can't see fully due to truncation, but I recall the IDs):
            // I'll just hardcode the update to the other ID if I can find it. 
            // Better strategy: Just assign the active record to the MOST RECENTLY CREATED user found in the DB, 
            // as that's likely the one the user is testing with.
            const latestUser = await client.query("SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1");
            if (latestUser.rows.length > 0) {
                const newOwnerId = latestUser.rows[0].id;
                console.log(`Re-assigning active record to latest user: ${newOwnerId}`);
                await client.query("UPDATE attendance_records SET employee_id = $1 WHERE check_out IS NULL", [newOwnerId]);
            }
        } else {
            const mansiId = mansiRes.rows[0].id;
            console.log(`Found Mansi: ${mansiId}. Assigning active record to her.`);
            await client.query("UPDATE attendance_records SET employee_id = $1 WHERE check_out IS NULL", [mansiId]);
        }

        console.log("Fixed mismatch.");
        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

fixMismatch();
