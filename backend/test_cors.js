const axios = require('axios');

async function testCors() {
    try {
        const res = await axios.options('https://hackoverflow-zpio.onrender.com/api/auth/send-otp', {
            headers: {
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'POST'
            }
        });
        console.log('CORS Headers:', res.headers['access-control-allow-origin']);
        console.log('CORS OK for localhost:5173');
    } catch (err) {
        if (err.response) {
            console.log('CORS blocked or error:', err.response.status, err.response.headers);
        } else {
            console.log('Error:', err.message);
        }
    }
}
testCors();
