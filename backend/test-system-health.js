// Native fetch used (Node 18+)

const BASE_URL = 'http://localhost:3000/api';
let TOKEN = '';

async function runTests() {
    console.log('--- STARTING SYSTEM HEALTH CHECK ---');

    // 1. Auth Test
    try {
        console.log('\n[TEST 1] Testing Admin Login...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@arisehrm.com', password: 'password123' })
        });

        if (!loginRes.ok) throw new Error(`Login Failed: ${loginRes.status} ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        TOKEN = loginData.token;
        console.log('✅ Admin Login Success');
    } catch (e) {
        console.error('❌ Login Failed:', e.message);
        return; // Cannot proceed without token
    }

    const headers = { 'Authorization': `Bearer ${TOKEN}` };

    // 2. Database Read - Employees
    try {
        console.log('\n[TEST 2] Fetching Employees...');
        const res = await fetch(`${BASE_URL}/employees`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        console.log(`✅ Fetched ${Array.isArray(data) ? data.length : 0} Employees`);
    } catch (e) {
        console.error('❌ Fetch Employees Failed:', e.message);
    }

    // 3. Database Read - Departments
    try {
        console.log('\n[TEST 3] Fetching Departments...');
        const res = await fetch(`${BASE_URL}/departments`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        console.log(`✅ Fetched ${data.length} Departments`);
    } catch (e) {
        console.error('❌ Fetch Departments Failed:', e.message);
    }

    // 4. Database Read - Leaves (Logic)
    try {
        console.log('\n[TEST 4] Fetching Leave Requests...');
        const res = await fetch(`${BASE_URL}/leaves`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        console.log(`✅ Fetched Leave Requests (Status: ${res.status})`);
    } catch (e) {
        console.error('❌ Fetch Leaves Failed:', e.message);
    }

    // 5. Database Read - Projects (Complex Logic)
    try {
        console.log('\n[TEST 5] Fetching Projects...');
        const res = await fetch(`${BASE_URL}/projects`, { headers });
        if (res.status === 404) {
            console.warn('⚠️ Projects endpoint returned 404 (Might mean no projects found or route missing)');
        } else if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || res.statusText);
        } else {
            const data = await res.json();
            console.log(`✅ Fetched Projects (Count: ${data.length})`);
        }
    } catch (e) {
        console.error('❌ Fetch Projects Failed:', e.message);
    }

    // 6. AI Chat (Integration)
    try {
        console.log('\n[TEST 6] Testing AI Chat Endpoint...');
        const res = await fetch(`${BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Hello' })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || res.statusText);
        }
        const data = await res.json();
        console.log(`✅ AI Responded: "${data.message.substring(0, 50)}..."`);
    } catch (e) {
        console.error('❌ AI Chat Failed:', e.message);
    }

    console.log('\n--- HEALTH CHECK COMPLETE ---');
}

runTests();
