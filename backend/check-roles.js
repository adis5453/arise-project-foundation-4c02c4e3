const { pool } = require('./db');
require('dotenv').config();

async function checkRoles() {
    const client = await pool.connect();

    try {
        console.log('🔍 Checking current roles in database...\n');

        // Get current roles
        const rolesResult = await client.query(`
      SELECT id, name, description 
      FROM roles 
      ORDER BY id
    `);

        console.log('Current Roles:');
        console.table(rolesResult.rows);

        // Check sequence value
        const seqResult = await client.query(`
      SELECT last_value, is_called 
      FROM roles_id_seq
    `);

        console.log('\nSequence Status:');
        console.log('Last Value:', seqResult.rows[0].last_value);
        console.log('Is Called:', seqResult.rows[0].is_called);

        // Check for conflicts
        const maxId = await client.query('SELECT MAX(id) as max_id FROM roles');
        console.log('\nMaximum Role ID:', maxId.rows[0].max_id);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkRoles();
