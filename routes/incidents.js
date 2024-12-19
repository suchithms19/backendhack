const express = require('express');
const router = express.Router();
const Incident = require('../models/incident');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Report new incident (for public)
router.post('/report', async (req, res) => {
  try {
    const { latitude, longitude, disasterType, description } = req.body;

    // Create initial incident
    const incident = new Incident({
      location: { latitude, longitude },
      disasterType,
      description
    });

    // Generate analysis immediately using ChatGPT
    const prompt = `Analyze this disaster situation and provide two separate sets of instructions:

1. For victims/people at the location:
Provide clear, step-by-step safety instructions for people at the disaster site.

2. For emergency operators:
Provide step-by-step instructions for handling the situation, including which emergency workers to deploy.

Disaster Details:
Type: ${disasterType}
Description: ${description}
Location: Latitude ${latitude}, Longitude ${longitude}

Format the response as JSON with this structure:
{
  "victimInstructions": ["step1", "step2", ...],
  "operatorInstructions": ["step1", "step2", ...],
  "requiredWorkers": ["worker1", "worker2", ...]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    // Parse the AI response
    const analysis = JSON.parse(completion.choices[0].message.content);

    // Update incident with analysis
    incident.analysis = {
      victimInstructions: analysis.victimInstructions,
      operatorInstructions: analysis.operatorInstructions,
      assignedWorkers: analysis.requiredWorkers.map(worker => ({
        type: worker,
        status: 'pending'
      }))
    };
    incident.status = 'analyzing';

    await incident.save();
    res.status(201).json({ 
      message: 'Incident reported successfully', 
      incident,
      immediateInstructions: analysis.victimInstructions 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all incidents (for admin)
router.get('/all', async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ timestamp: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update worker status
router.patch('/worker-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // If just updating the overall status (for assignment)
    if (status && !req.body.workerType) {
      incident.status = status;
      await incident.save();
      return res.json(incident);
    }

    // For updating individual worker status
    const { workerType } = req.body;
    const workerIndex = incident.analysis.assignedWorkers.findIndex(
      w => w.type === workerType
    );

    if (workerIndex === -1) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    incident.analysis.assignedWorkers[workerIndex].status = status;
    
    // Update incident status based on worker statuses
    if (incident.analysis.assignedWorkers.every(w => w.status === 'completed')) {
      incident.status = 'handled';
    } else if (status === 'enroute' || status === 'onsite') {
      incident.status = 'handling';
    }

    await incident.save();
    res.json(incident);
  } catch (error) {
    console.error('Error updating worker status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 