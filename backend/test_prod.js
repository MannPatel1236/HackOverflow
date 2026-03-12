const axios = require('axios');

async function testProd() {
    try {
        // 1. Try to login to prod
        console.log('Attempting login to production...');
        const loginRes = await axios.post('https://hackoverflow-zpio.onrender.com/api/auth/admin/login', {
            email: 'admin@civicai.in',
            password: 'password123' // Testing if our database reset took effect there
        }).catch(e => {
            console.log('Login failed with password123. Prod DB needs reset.');
            return null;
        });

        if (loginRes && loginRes.data.token) {
            console.log('Login Successful!');

            // 2. Test map endpoint to see if our recent code changes are deployed
            try {
                const mapRes = await axios.get('https://hackoverflow-zpio.onrender.com/api/complaints/map/data?state=Maharashtra', {
                    headers: { Authorization: `Bearer ${loginRes.data.token}` }
                });
                console.log('Map Data returned. First item:', JSON.stringify(mapRes.data.data[0], null, 2));
            } catch (e) {
                console.log('Map data fetch failed:', e.message);
            }
        }
    } catch (err) {
        console.error('Fatal Test Error:', err.message);
    }
}

testProd();
