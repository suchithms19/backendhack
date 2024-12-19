const mongoose = require('mongoose');

const voiceIncidentSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true
  },
  transcription: {
    type: String,
    required: true
  },
  recordingUrl: {
    type: String,
    required: true
  },
  callSid: {
    type: String,
    required: true,
    unique: true
  },
  duration: {
    type: Number,
    default: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  extractedLocation: {
    type: String
  },
  status: {
    type: String,
    enum: ['new', 'processing', 'resolved'],
    default: 'new'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VoiceIncident', voiceIncidentSchema); 