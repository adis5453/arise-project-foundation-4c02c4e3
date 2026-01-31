
require('dotenv').config();
const fetch = global.fetch || require('node-fetch');

const API_URL = 'http://localhost:3000/api';

async function verifyProfileApi() {
    try {
        console.log('1. Logging in as mansi...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'mansir5453@gmail.com',
                password: 'password123'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        const userId = loginData.user.id;
        console.log(`   Logged in. User ID: ${userId}`);

        console.log('2. Fetching Employee Profile...');
        const getRes = await fetch(`${API_URL}/employees/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!getRes.ok) throw new Error(`Fetch profile failed: ${getRes.status}`);
        const profile = await getRes.json();
        console.log('   Fetch success. Current Phone:', profile.phone_number);

        console.log('3. Updating Employee Profile (Phone & Preferences)...');
        const updateData = {
            phone_number: '999-888-7777',
            preferences: {
                theme: 'dark',
                notifications: { email: true, sms: true }
            }
        };

        const updateRes = await fetch(`${API_URL}/employees/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (!updateRes.ok) {
            const err = await updateRes.json();
            console.error('Update Error Details:', JSON.stringify(err, null, 2));
            throw new Error(`Update failed: ${updateRes.status} - ${err.error || err.message}`);
        }
        console.log('   Update success.');

        console.log('4. Verifying Update...');
        const verifyRes = await fetch(`${API_URL}/employees/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedProfile = await verifyRes.json();

        if (updatedProfile.phone_number === '999-888-7777' &&
            updatedProfile.preferences?.theme === 'dark') {
            console.log('   Verification SUCCESS: Data was updated correctly.');
        } else {
            console.error('   Verification FAILED: Data mismatch.', updatedProfile);
        }

    } catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
}

verifyProfileApi();
