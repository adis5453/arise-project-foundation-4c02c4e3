const BASE_URL = 'http://localhost:3001/api';

async function testSettings() {
    console.log('0. Testing Ping...');
    const pingRes = await fetch(`${BASE_URL}/test-ping`);
    console.log('Ping Status:', pingRes.status);
    if (pingRes.ok) console.log('Ping Response:', await pingRes.json());
    else console.log('Ping Failed');

    console.log('1. Logging in as admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@arisehrm.com', password: 'password123' })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');

    console.log('\n2. Testing GET /api/settings/system...');
    const getRes = await fetch(`${BASE_URL}/settings/system`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET Status:', getRes.status);
    if (getRes.ok) {
        console.log('GET Response:', await getRes.json());
    } else {
        console.log('GET Failed:', await getRes.text());
    }

    console.log('\n3. Testing PUT /api/settings/system...');
    const putRes = await fetch(`${BASE_URL}/settings/system`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            office_lat: '28.6139',
            office_lng: '77.2090',
            office_radius: '150'
        })
    });
    console.log('PUT Status:', putRes.status);
    console.log('PUT Response:', await putRes.text());
}

testSettings();
