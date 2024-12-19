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
    
    // Log the complete request body for debugging
    console.log('Voice webhook received:', req.body);

    // Create initial record
    const incident = new VoiceIncident({
      phoneNumber: req.body.From || 'unknown',
      callSid: req.body.CallSid || 'unknown',
      recordingUrl: 'pending',
      transcription: 'pending',
      status: 'new'
    });

    await incident.save();
    console.log('Initial incident record created:', incident._id);

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
  console.log('Recording webhook received:', req.body);
  const twiml = new VoiceResponse();
  
  try {
    if (!req.body.CallSid) {
      throw new Error('No CallSid provided');
    }

    // Update the incident with recording information
    const updatedIncident = await VoiceIncident.findOneAndUpdate(
      { callSid: req.body.CallSid },
      {
        recordingUrl: req.body.RecordingUrl || 'no-url',
        duration: parseInt(req.body.RecordingDuration) || 0,
        status: 'recording_complete'
      },
      { new: true }
    );

    console.log('Updated incident with recording:', updatedIncident?._id);

    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Thank you for your report. We have received your emergency information and help will be dispatched as needed.');

  } catch (error) {
    console.error('Error in handle-recording:', error);
    twiml.say('An error occurred processing your recording. Please try again.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle transcription completion
router.post('/handle-transcription', async (req, res) => {
  console.log('Transcription webhook received:', req.body);
  
  try {
    if (!req.body.CallSid) {
      throw new Error('No CallSid provided');
    }

    const transcriptionText = req.body.TranscriptionText || '';
    let extractedLocation = '';

    // Only try to extract location if we have transcription text
    if (transcriptionText) {
      try {
        const locationKeywords = ['at', 'in', 'near', 'around', 'location'];
        const words = transcriptionText.split(' ');
        for (let i = 0; i < words.length; i++) {
          if (locationKeywords.includes(words[i].toLowerCase())) {
            extractedLocation = words.slice(i + 1, i + 5).join(' ');
            break;
          }
        }
      } catch (error) {
        console.error('Error extracting location:', error);
        extractedLocation = 'location extraction failed';
      }
    }

    // Update the incident with transcription
    const updatedIncident = await VoiceIncident.findOneAndUpdate(
      { callSid: req.body.CallSid },
      {
        transcription: transcriptionText || 'no transcription available',
        extractedLocation,
        status: 'completed'
      },
      { new: true }
    );

    console.log('Updated incident with transcription:', updatedIncident?._id);

    res.status(200).json({
      success: true,
      message: 'Transcription processed successfully'
    });
  } catch (error) {
    console.error('Error processing transcription:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
      error: error.message
    });
  }
});

module.exports = router; 