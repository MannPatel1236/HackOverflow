// routes/verify.js
const express = require('express');
const router = express.Router();
const client = require('../lib/twilio');

// Send OTP
router.post('/send-otp', async (req, res) => {
    const { phoneNumber } = req.body; // e.g. "+919876543210"

    try {
        const verification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({ to: phoneNumber, channel: 'sms' });

        res.json({ success: true, status: verification.status });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { phoneNumber, code } = req.body;

    try {
        const result = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks.create({ to: phoneNumber, code });

        if (result.status === 'approved') {
            res.json({ success: true, message: 'Phone verified!' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;