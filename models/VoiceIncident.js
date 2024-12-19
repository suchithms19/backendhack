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
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['new', 'processing', 'resolved'],
    default: 'new'
  }
});

module.exports = mongoose.model('VoiceIncident', voiceIncidentSchema); 