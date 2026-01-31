const { pool } = require('./db');

pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_profiles'").then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    pool.end();
}).catch(e => console.error(e));
