
const { pool } = require('./backend/db');

async function checkSchema() {
    try {
        const queries = [
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'department_id'",
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'total_days'",
            "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'attendance_hours_trigger'"
        ];

        console.log("Checking schema state...");
        
        for (const q of queries) {
            const res = await pool.query(q);
            console.log(`Query: ${q.substring(0, 50)}... -> Found: ${res.rows.length > 0}`);
        }
        
    } catch (e) {
        console.error("Error checking schema:", e.message);
    } finally {
        pool.end();
    }
}

checkSchema();
