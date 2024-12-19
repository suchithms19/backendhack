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

    const incident = new Incident({
      location: { latitude, longitude },
      disasterType,
      description
    });

    await incident.save();
    res.status(201).json({ message: 'Incident reported successfully', incident });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all incidents (for admin)
router.get('/all', async (req, res) => {
  try {
    const incidents = await Incident.find();
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze incident with ChatGPT (for admin)
router.post('/analyze/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Generate prompt for ChatGPT
    const prompt = `Analyze this disaster situation and provide steps for handling it in points....one for admin who has dashboard and sees all the user queries and send to stakeholders and one for user who is in disater place:
    Type of Disaster: ${incident.disasterType}
    Description: ${incident.description}
    Location: Latitude ${incident.location.latitude}, Longitude ${incident.location.longitude}`;

    // Get analysis from ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    // Update incident with AI analysis
    incident.aiAnalysis = completion.choices[0].message.content;
    incident.status = 'analyzing';
    await incident.save();

    res.json({ message: 'Analysis completed', incident });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 