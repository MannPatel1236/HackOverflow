const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Admin = require('./models/Admin');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admins = await Admin.find({});
        console.log('Admins in DB:', admins.length);
        admins.forEach(a => console.log(a.email, a.role, a.state));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
