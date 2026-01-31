// Quick fix to reset rate limiter
// Run this script if you get locked out

const http = require('http');

console.log('🔓 Clearing rate limit...');
console.log('');
console.log('⚠️  NOTE: With the updated configuration:');
console.log('   - 10 login attempts allowed (was 5)');
console.log('   - 5 minute window (was 15)');
console.log('   - Successful logins don\'t count');
console.log('');
console.log('✅ Just restart the backend server to reset:');
console.log('   1. Stop backend (Ctrl+C)');
console.log('   2. Start again (node index.js)');
console.log('   3. Rate limit will be cleared');
console.log('');
console.log('🎯 Or wait 5 minutes for automatic reset');
