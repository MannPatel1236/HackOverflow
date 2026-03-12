const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testMerging() {
  try {
    console.log('--- Testing Complaint Merging ---');

    // 1. Log in to get token
    const loginRes = await axios.post(`${API_URL}/auth/send-otp`, { phone: '+919876543210' });
    const devOtp = loginRes.data.dev_otp;
    const verifyRes = await axios.post(`${API_URL}/auth/verify-otp`, { phone: '+919876543210', otp: devOtp });
    const token = verifyRes.data.token;
    const authHeader = { Authorization: `Bearer ${token}` };

    // 2. File 3 similar complaints
    const complaints = [
      { text: 'Water leakage in building A', district: 'Mumbai', state: 'Maharashtra', city: 'Mumbai' },
      { text: 'Severe water pipe leak', district: 'Mumbai', state: 'Maharashtra', city: 'Mumbai' },
      { text: 'Water dripping from main line', district: 'Mumbai', state: 'Maharashtra', city: 'Mumbai' },
    ];

    console.log('Filing 3 complaints...');
    const trackIds = [];
    for (const c of complaints) {
      const res = await axios.post(`${API_URL}/complaints/file`, c, { headers: authHeader });
      trackIds.push(res.data.tracking_id);
      console.log(`Filed: ${res.data.tracking_id}`);
    }

    // 3. Log in as admin to check dashboard list
    const adminLoginRes = await axios.post(`${API_URL}/auth/admin/login`, { email: 'admin@civicai.in', password: 'password123' });
    const adminToken = adminLoginRes.data.token;
    const adminHeader = { Authorization: `Bearer ${adminToken}` };

    const listRes = await axios.get(`${API_URL}/complaints`, { headers: adminHeader });
    const master = listRes.data.complaints.find(c => trackIds.includes(c.tracking_id));

    console.log('\n--- Admin Result ---');
    if (master) {
      console.log(`Found Master Tracking ID: ${master.tracking_id}`);
      console.log(`Duplicate Count: ${master.duplicate_count}`);
      if (master.duplicate_count === 2) {
        console.log('✅ PASS: Duplicates grouped successfully (+2)');
      } else {
        console.log('❌ FAIL: Expected 2 duplicates, found', master.duplicate_count);
      }
    } else {
      console.log('❌ FAIL: Master complaint not found in list');
    }

    // 4. Update status of master and check propagation
    console.log('\n--- Testing Status Propagation ---');
    await axios.patch(`${API_URL}/complaints/${master._id}/status`, { status: 'Under Review', note: 'Fixing all' }, { headers: adminHeader });
    
    // Check children status
    for (const tid of trackIds) {
      const trackRes = await axios.get(`${API_URL}/complaints/track/${tid}`);
      const c = trackRes.data.complaint;
      console.log(`Tracking ID: ${tid} | Status: ${c.status}`);
      if (c.status !== 'Under Review') {
        console.log(`❌ FAIL: Status not propagated to ${tid}`);
      }
    }
    console.log('✅ Status propagation test complete');

  } catch (err) {
    if (err.response) {
      console.error('Test Error (Response):', err.response.status, err.response.data);
    } else {
      console.error('Test Error (Message):', err.message);
    }
  }
}

testMerging();
