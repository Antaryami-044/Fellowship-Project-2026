require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- Connect to MongoDB ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log('API Database Connected'))
    .catch(err => console.error('DB Connection Error:', err));

// --- Mongoose Schema (Must match the new pipeline) ---
const performanceSchema = new mongoose.Schema({
    state_name: String,
    district_name: String,
    financial_year: String,
    total_jobcards_issued: Number,
    total_workers: Number,
    total_households_provided_employment: Number,
});

const Performance = mongoose.model('Performance', performanceSchema);

// --- API Endpoints ---

app.get('/', (req, res) => {
    res.send('MGNREGA API is running!');
});

// --- NEW ENDPOINT: Get a list of all unique states ---
app.get('/api/states', async (req, res) => {
    try {
        const states = await Performance.distinct('state_name');
        res.json(states.sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- MODIFIED ENDPOINT: Get districts FOR A SPECIFIC STATE ---
app.get('/api/districts/:state', async (req, res) => {
    try {
        const stateName = req.params.state;
        const districts = await Performance.distinct('district_name', { state_name: stateName });
        
        if (districts.length === 0) {
            return res.status(404).json({ message: 'No districts found for this state' });
        }
        res.json(districts.sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- UNCHANGED ENDPOINT: Get all data for a specific district ---
app.get('/api/performance/:district', async (req, res) => {
    try {
        const districtData = await Performance.find({ district_name: req.params.district })
            .sort({ financial_year: -1 }); // Newest year first
        
        if (districtData.length === 0) {
            return res.status(404).json({ message: 'No data found for this district' });
        }
        res.json(districtData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API server running on port ${PORT}`));