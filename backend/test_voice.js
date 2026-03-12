require('dotenv').config();
const { createClient } = require('@deepgram/sdk');
const fs = require('fs');

async function test() {
  try {
    console.log('Sending to Deepgram...');
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY || 'MISSING_KEY');
    
    // Test stream or direct file
    // Let's create a tiny dummy WAV file payload just to see if Deepgram accepts it or if it throws 40x on auth
    const url = 'https://dpgr.am/spacewalk.wav';
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url },
      {
        model: 'nova-2',
        smart_format: true,
        detect_language: true,
      }
    );

    if (error) {
       console.error('Deepgram Error:', error);
    } else {
       console.log('Transcript:', result?.results?.channels[0]?.alternatives[0]?.transcript);
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
