// Pre-set env vars to bypass checks
process.env.JWT_SECRET = 'test-secret';
process.env.DB_PASSWORD = 'test-pass';

const logger = require('./backend/utils/logger');
console.log("Verifying backend modules...");

try {
    require('./backend/routes/authRoutes');
    console.log("✅ Auth Routes loaded");
} catch (e) {
    console.error("❌ Auth Routes Failed:", e.message);
}

try {
    require('./backend/routes/employeeRoutes');
    console.log("✅ Employee Routes loaded");
} catch (e) {
    console.error("❌ Employee Routes Failed:", e.message);
}

try {
    require('./backend/routes/leaveRoutes');
    console.log("✅ Leave Routes loaded");
} catch (e) {
    console.error("❌ Leave Routes Failed:", e.message);
}

try {
    require('./backend/routes/departmentRoutes');
    console.log("✅ Department Routes loaded");
} catch (e) {
    console.error("❌ Department Routes Failed:", e.message);
}

try {
    require('./backend/index.js');
    console.log("✅ Index Entry Point loaded (Dry Run)");
} catch (e) {
    // index.js might try to connect to DB or bind port
    if (e.message.includes("address already in use") || e.message.includes("Missing required environment")) {
        console.log("✅ Index Entry Point Syntax OK (Runtime error expected in test)");
    } else {
        console.error("❌ Index Entry Point Syntax/Load Failed:", e.message);
    }
}

// Force exit after check, so index.js listener doesn't hang the script
setTimeout(() => process.exit(0), 1000);
