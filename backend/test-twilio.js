const axios = require('axios');
axios.post('http://localhost:5001/api/whatsapp/webhook', {
  From: 'whatsapp:+1234567890',
  Body: '',
  NumMedia: '1',
  MediaUrl0: 'https://api.twilio.com/2010-04-01/Accounts/AC.../Messages/MM.../Media/ME...',
  MediaContentType0: 'audio/ogg'
}, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
.then(res => console.log('Success:', res.status))
.catch(err => console.log('Error:', err.message));
