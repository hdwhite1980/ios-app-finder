// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to proxy iTunes search requests
app.get('/api/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: 'App name is required' });
    }
    
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term,
        entity: 'software',
        limit: 10
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching from iTunes API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch app data',
      details: error.message 
    });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});