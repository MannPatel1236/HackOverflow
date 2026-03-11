const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Admin = require('./models/Admin');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await Admin.findOne({ email: 'admin@civicai.in' });
        if (admin) {
            // Just set plain text, the pre('save') hook handles the bcrypt hashing!
            admin.password_hash = 'password123';
            await admin.save();
            console.log('Password reset successfully for admin@civicai.in to password123');
        } else {
            console.log('admin@civicai.in not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
