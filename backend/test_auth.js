const axios = require('axios');

async function testProd() {
    try {
        console.log('Testing Admin Login on Prod...');
        try {
            const loginRes = await axios.post('https://hackoverflow-zpio.onrender.com/api/auth/admin/login', {
                email: 'admin@civicai.in',
                password: 'password123'
            });
            console.log('Admin Login Success:', !!loginRes.data.token);
        } catch (e) {
            console.error('Admin Login Error:', e.response ? e.response.data : e.message);
        }

        console.log('\nTesting Send OTP on Prod...');
        try {
            const otpRes = await axios.post('https://hackoverflow-zpio.onrender.com/api/auth/send-otp', {
                phone: '+919876543210'
            });
            console.log('Send OTP Success:', otpRes.data);
        } catch (e) {
            console.error('Send OTP Error:', e.response ? e.response.data : e.message);
        }
    } catch (err) {
        console.error('Fatal Test Error:', err.message);
    }
}

testProd();
