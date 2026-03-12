const axios = require('axios');

async function testFlow() {
  const API_URL = 'http://localhost:5001/api';

  try {
    // 1. Send OTP
    console.log('Sending OTP...');
    const sendOTPRes = await axios.post(`${API_URL}/auth/send-otp`, { phone: '+919998887776' });
    const otp = sendOTPRes.data.dev_otp;
    console.log('Received OTP:', otp);

    // 2. Verify OTP
    console.log('Verifying OTP...');
    const verifyRes = await axios.post(`${API_URL}/auth/verify-otp`, { phone: '+919998887776', otp });
    const token = verifyRes.data.token;
    console.log('Token received:', typeof token);

    // 3. Get Me
    console.log('Fetching Me...');
    const meRes = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Me:', meRes.data.user);

    // 4. File Complaint
    console.log('Filing Complaint...');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('text', 'There is a huge pothole here');
    form.append('state', 'Maharashtra');
    form.append('district', 'Mumbai Suburban');
    form.append('city', 'Mumbai');

    const fileRes = await axios.post(`${API_URL}/complaints/file`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    });
    console.log('Filed complaint:', fileRes.data.tracking_id);

    // 5. Fetch My Complaints
    console.log('Fetching My Complaints...');
    const myRes = await axios.get(`${API_URL}/complaints/my`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('My Complaints count:', myRes.data.complaints.length);
    console.log('My Complaints IDs:', myRes.data.complaints.map(c => c.tracking_id));

  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

testFlow();
