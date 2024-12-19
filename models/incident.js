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
    enum: ['new', 'analyzing', 'assigned', 'handled'],
    default: 'new'
  },
  analysis: {
    victimInstructions: {
      type: [String],
      default: []
    },
    operatorInstructions: {
      type: [String],
      default: []
    },
    assignedWorkers: [{
      type: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'enroute', 'onsite', 'completed'],
        default: 'pending'
      }
    }]
  }
});

module.exports = mongoose.model('Incident', incidentSchema); 