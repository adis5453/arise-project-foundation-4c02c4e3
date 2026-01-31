const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = {
                        status: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(body)
                    };
                    resolve(response);
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing Arise HRM API Endpoints\n');

    try {
        // Test health endpoint
        console.log('1. Testing Health Check...');
        const health = await testEndpoint('/health');
        console.log(`   Status: ${health.status}`);
        console.log(`   Response: ${JSON.stringify(health.body, null, 2)}\n`);

        // Test roles endpoint
        console.log('2. Testing Roles Endpoint...');
        const roles = await testEndpoint('/api/roles');
        console.log(`   Status: ${roles.status}`);
        if (roles.status === 200) {
            console.log(`   Roles found: ${roles.body.length}`);
            console.log(`   Sample roles: ${JSON.stringify(roles.body.slice(0, 3), null, 2)}\n`);
        } else {
            console.log(`   Error: ${JSON.stringify(roles.body)}\n`);
        }

        // Test leave types endpoint
        console.log('3. Testing Leave Types Endpoint...');
        const leaveTypes = await testEndpoint('/api/leaves/types');
        console.log(`   Status: ${leaveTypes.status}`);
        if (leaveTypes.status === 200) {
            console.log(`   Leave types found: ${leaveTypes.body.length}`);
            console.log(`   Sample types: ${JSON.stringify(leaveTypes.body.slice(0, 3), null, 2)}\n`);
        } else {
            console.log(`   Error: ${JSON.stringify(leaveTypes.body)}\n`);
        }

        // Test departments endpoint
        console.log('4. Testing Departments Endpoint...');
        const departments = await testEndpoint('/api/departments');
        console.log(`   Status: ${departments.status}`);
        if (departments.status === 200) {
            console.log(`   Departments found: ${departments.body.length}`);
            console.log(`   Sample departments: ${JSON.stringify(departments.body.slice(0, 3), null, 2)}\n`);
        } else {
            console.log(`   Error: ${JSON.stringify(departments.body)}\n`);
        }

        // Test login endpoint (without actual credentials)
        console.log('5. Testing Login Endpoint (invalid credentials)...');
        const login = await testEndpoint('/api/auth/login', 'POST', {
            email: 'test@example.com',
            password: 'wrongpassword'
        });
        console.log(`   Status: ${login.status}`);
        console.log(`   Response: ${JSON.stringify(login.body, null, 2)}\n`);

        console.log('✅ API Testing Complete');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

runTests();
