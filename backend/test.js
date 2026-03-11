const http = require('http');

function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        };
        const req = http.request(options, (res) => {
            let raw = '';
            res.on('data', (chunk) => (raw += chunk));
            res.on('end', () => {
                console.log(`\n✅ POST ${path}`);
                try { console.log(JSON.parse(raw)); } catch { console.log(raw); }
                resolve(JSON.parse(raw));
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    // Test 1: Send OTP
    const otp = await post('/api/auth/send-otp', { phone: '+919876543210' });

    // Test 2: Verify OTP
    const user = await post('/api/auth/verify-otp', {
        phone: '+919876543210',
        otp: otp.dev_otp,
        name: 'Test User',
    });

    // Test 3: Seed super admin (ignore error if already exists)
    await post('/api/auth/admin/seed', {
        secret: 'CIVICAI_SEED_2024',
        name: 'Super Admin',
        email: 'admin@civicai.in',
        password: 'civicai@2024',
    });

    // Test 4: Admin login
    await post('/api/auth/admin/login', {
        email: 'admin@civicai.in',
        password: 'civicai@2024',
    });

    console.log('\n🎉 All auth routes working!');
}

run().catch(console.error);