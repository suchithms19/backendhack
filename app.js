const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Add CORS middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mssuchith:dZh7Y5l1ARRv1oz7@cluster0.irnuaxp.mongodb.net/disaster',);

// Routes
const incidentRoutes = require('./routes/incidents');
app.use('/api/incidents', incidentRoutes);

const twilioRoutes = require('./routes/twilioRoutes');
app.use('/api/twilio', twilioRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 