const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  location: {
    type: {
      latitude: Number,
      longitude: Number
    },
    required: true
  },
  disasterType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['new', 'analyzing', 'handled'],
    default: 'new'
  },
  aiAnalysis: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('Incident', incidentSchema); 