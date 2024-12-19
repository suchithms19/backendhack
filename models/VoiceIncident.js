const mongoose = require('mongoose');

const voiceIncidentSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    default: 'unknown'
  },
  transcription: {
    type: String,
    default: 'pending'
  },
  recordingUrl: {
    type: String,
    default: 'pending'
  },
  callSid: {
    type: String,
    required: true
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
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['new', 'recording_complete', 'completed', 'error'],
    default: 'new'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VoiceIncident', voiceIncidentSchema); 