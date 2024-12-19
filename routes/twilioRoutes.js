const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;
const VoiceIncident = require('../models/VoiceIncident');

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Handle incoming calls
router.post('/voice', async (req, res) => {
  try {
    const twiml = new VoiceResponse();
    console.log('Incoming call from:', req.body.From);
    console.log('Call SID:', req.body.CallSid);

    // Initial greeting and instructions
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Welcome to the Emergency Helpline. This is an automated system to report emergencies.');

    twiml.pause({ length: 1 });

    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Please clearly describe your emergency and location after the beep. Press hash key when finished.');

    // Record the caller's message
    twiml.record({
      action: '/api/twilio/handle-recording',
      transcribe: true,
      transcribeCallback: '/api/twilio/handle-transcription',
      maxLength: 300,
      timeout: 10,
      finishOnKey: '#',
      playBeep: true
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in voice route:', error);
    const twiml = new VoiceResponse();
    twiml.say('An error occurred. Please try again later.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Handle recording completion
router.post('/handle-recording', async (req, res) => {
  const twiml = new VoiceResponse();
  
  try {
    const {
      From: phoneNumber,
      CallSid: callSid,
      RecordingUrl: recordingUrl,
      RecordingDuration: duration
    } = req.body;

    // Create initial incident record
    await VoiceIncident.create({
      phoneNumber,
      callSid,
      recordingUrl,
      duration: parseInt(duration) || 0,
      transcription: 'Processing...', // Will be updated when transcription is ready
      status: 'new'
    });

    console.log('Initial voice incident record created for call:', callSid);

    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Thank you for your report. We have received your emergency information and help will be dispatched as needed.');

    twiml.pause({ length: 1 });

  } catch (error) {
    console.error('Error in handle-recording:', error);
    twiml.say('An error occurred processing your recording. Please try again.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle transcription completion
router.post('/handle-transcription', async (req, res) => {
  try {
    const {
      TranscriptionText: transcription,
      CallSid: callSid,
      RecordingUrl: recordingUrl,
      From: phoneNumber
    } = req.body;

    console.log('Transcription received for call:', callSid);
    console.log('Transcription:', transcription);

    // Extract location information from transcription
    let extractedLocation = '';
    try {
      // Simple location extraction (you can enhance this with NLP or OpenAI)
      const locationKeywords = ['at', 'in', 'near', 'around', 'location'];
      const words = transcription.split(' ');
      for (let i = 0; i < words.length; i++) {
        if (locationKeywords.includes(words[i].toLowerCase())) {
          extractedLocation = words.slice(i + 1, i + 5).join(' ');
          break;
        }
      }
    } catch (error) {
      console.error('Error extracting location:', error);
    }

    // Update the incident record with transcription and location
    const updatedIncident = await VoiceIncident.findOneAndUpdate(
      { callSid },
      {
        transcription,
        extractedLocation,
        status: 'processing'
      },
      { new: true }
    );

    console.log('Updated incident:', updatedIncident);

    res.status(200).json({
      success: true,
      message: 'Transcription processed successfully'
    });
  } catch (error) {
    console.error('Error processing transcription:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing transcription'
    });
  }
});

// Get all voice incidents
router.get('/incidents', async (req, res) => {
  try {
    const incidents = await VoiceIncident.find()
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.json({
      success: true,
      data: incidents
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching incidents'
    });
  }
});

// Get specific incident
router.get('/incidents/:id', async (req, res) => {
  try {
    const incident = await VoiceIncident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching incident'
    });
  }
});

module.exports = router; 