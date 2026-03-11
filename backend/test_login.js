const axios = require('axios');

async function testLogin() {
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/admin/login', {
            email: 'testlogin@civicai.in',
            password: 'password123'
        });

        console.log('Login token:', !!loginRes.data.token);

        // Try map data as admin
        const mapRes = await axios.get('http://localhost:5000/api/complaints/map/data?state=Maharashtra', {
            headers: { Authorization: `Bearer ${loginRes.data.token}` }
        });
        console.log('Map data items:', mapRes.data.data.length);
    } catch (err) {
        if (err.response) {
            console.error('Error Response:', err.response.status, err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
}

testLogin();
