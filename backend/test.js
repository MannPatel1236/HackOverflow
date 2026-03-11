const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');

mongoose.connect('MONGO_URI').then(async () => {
  const User = require('./models/User');
  const user = await User.findOne();
  if (!user) return console.log('No user found');
  
  const token = jwt.sign({ id: user._id, type: 'user' }, 'thisisourhackathoninwhichwearemakingcivicai');
  
  const fd = new FormData();
  fd.append('text', 'hello bbg from test script');
  fd.append('state', 'Maharashtra');
  fd.append('district', 'mumbai');
  fd.append('city', 'vile parle');
  
  try {
    const res = await axios.post('http://localhost:5001/api/complaints/file', fd, {
      headers: {
        ...fd.getHeaders(),
        Authorization: 'Bearer ' + token
      }
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.log('AXIOS ERROR:', err.message);
    if (err.response) {
      console.log('RESPONSE DATA:', err.response.data);
    }
  }
  process.exit(0);
});