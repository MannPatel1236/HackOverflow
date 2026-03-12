const mongoose = require('mongoose');
require('dotenv').config();

async function merge() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./models/User');
  const Complaint = require('./models/Complaint');

  const allUsers = await User.find();
  const phoneMap = {}; // raw 10-digit -> [users]

  for (const u of allUsers) {
    const rawDigits = u.phone.replace(/\D/g, '').slice(-10); // get last 10 digits
    if (!phoneMap[rawDigits]) phoneMap[rawDigits] = [];
    phoneMap[rawDigits].push(u);
  }

  for (const [rawDigits, users] of Object.entries(phoneMap)) {
    if (users.length > 1) {
      console.log(`Merging ${users.length} accounts for ${rawDigits}...`);
      
      // Sort users: prefer the one with +91, otherwise the oldest
      users.sort((a, b) => b.phone.includes('+91') ? 1 : -1);
      const masterUser = users[0];
      
      // Ensure master has +91
      const normalizedPhone = `+91${rawDigits}`;
      if (masterUser.phone !== normalizedPhone) {
        masterUser.phone = normalizedPhone;
        await masterUser.save();
      }

      // Re-assign complaints from dupes to master
      for (let i = 1; i < users.length; i++) {
        const dupe = users[i];
        const updateRes = await Complaint.updateMany(
          { user_id: dupe._id },
          { $set: { user_id: masterUser._id, phone: normalizedPhone } }
        );
        console.log(`- Moved ${updateRes.modifiedCount} complaints from ${dupe._id} to ${masterUser._id}`);
        // Delete dupe
        await User.deleteOne({ _id: dupe._id });
        console.log(`- Deleted duplicate user ${dupe._id}`);
      }
    } else if (users.length === 1) {
      // Just normalize to +91 if needed
      const u = users[0];
      const normalizedPhone = `+91${rawDigits}`;
      if (u.phone !== normalizedPhone && rawDigits.length === 10) {
         console.log(`Normalizing ${u.phone} to ${normalizedPhone}`);
         u.phone = normalizedPhone;
         await u.save();
         await Complaint.updateMany({ user_id: u._id }, { $set: { phone: normalizedPhone } });
      }
    }
  }

  console.log('Done merging.');
  process.exit(0);
}

merge().catch(console.error);
