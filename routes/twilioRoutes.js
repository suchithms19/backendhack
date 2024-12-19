const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Handle incoming calls
router.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();

  // Initial greeting and instructions
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Welcome to the Emergency Helpline. Please describe your emergency situation and location after the beep. Press any key when finished.');

  // Record the caller's message
  twiml.record({
    action: '/api/twilio/handle-recording',
    transcribe: true,
    transcribeCallback: '/api/twilio/handle-transcription',
    maxLength: 120,
    finishOnKey: '1234567890*#',
    playBeep: true
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle recording completion
router.post('/handle-recording', async (req, res) => {
  const twiml = new VoiceResponse();
  
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Thank you for your report. We are processing your information and will send help as needed.');

  // Get caller's location if available
  const caller = req.body.From;
  try {
    const lookup = await client.lookups.v2.phoneNumbers(caller).fetch();
    // Store location data if available
    if (lookup.carrier && lookup.carrier.error_code === null) {
      // Save location data to your database
    }
  } catch (error) {
    console.error('Error looking up caller location:', error);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle transcription completion
router.post('/handle-transcription', async (req, res) => {
  const transcription = req.body.TranscriptionText;
  const recordingUrl = req.body.RecordingUrl;
  const caller = req.body.From;
  
  try {
    // Create a new incident report
    const incident = {
      phoneNumber: caller,
      transcription: transcription,
      recordingUrl: recordingUrl,
      timestamp: new Date(),
      status: 'new'
    };

    // Save to your database
    // await Incident.create(incident);

    // You could also implement location extraction from the transcription
    // using NLP or other text analysis methods

    res.status(200).send('Transcription processed');
  } catch (error) {
    console.error('Error processing transcription:', error);
    res.status(500).send('Error processing transcription');
  }
});

module.exports = router; 