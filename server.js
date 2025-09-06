const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// API Keys from Render Environment Variables
const API_KEYS = {
  alphaVantage: process.env.ALPHA_KEY,
  fmp: process.env.FMP_KEY,
  finnhub: process.env.FINNHUB_KEY,
  groq: process.env.GROQ_KEY,
  huggingface: process.env.HUGGINGFACE_KEY,
  newsapi: process.env.NEWSAPI_KEY
};

// Track API usage to handle rate limits
const apiUsage = {};

// API Calling Functions with Fallbacks
async function callAlphaVantage(query) {
  if (!API_KEYS.alphaVantage) throw new Error('API key not configured');
  
  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${API_KEYS.alphaVantage}`;
  const response = await axios.get(url);
  return response.data;
}

async function callFMP(query) {
  if (!API_KEYS.fmp) throw new Error('API key not configured');
  
  const url = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&apikey=${API_KEYS.fmp}`;
  const response = await axios.get(url);
  return response.data;
}

async function callFinnhub(query) {
  if (!API_KEYS.finnhub) throw new Error('API key not configured');
  
  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${API_KEYS.finnhub}`;
  const response = await axios.get(url);
  return response.data;
}

async function callGroq(query) {
  if (!API_KEYS.groq) throw new Error('API key not configured');
  
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const response = await axios.post(url, {
    model: 'llama3-70b-8192',
    messages: [{ role: 'user', content: query }],
    temperature: 0.7
  }, {
    headers: { Authorization: `Bearer ${API_KEYS.groq}` }
  });
  
  return response.data.choices[0].message.content;
}

async function callHuggingFace(query) {
  if (!API_KEYS.huggingface) throw new Error('API key not configured');
  
  const url = 'https://api-inference.huggingface.co/models/gpt2';
  const response = await axios.post(url, { inputs: query }, {
    headers: { Authorization: `Bearer ${API_KEYS.huggingface}` }
  });
  
  return response.data[0].generated_text;
}

async function callNewsAPI(query) {
  if (!API_KEYS.newsapi) throw new Error('API key not configured');
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${API_KEYS.newsapi}`;
  const response = await axios.get(url);
  return response.data;
}

// API Calling Order with Fallbacks
const apiCallingOrder = [
  { name: 'groq', call: callGroq },
  { name: 'huggingface', call: callHuggingFace },
  { name: 'alphavantage', call: callAlphaVantage },
  { name: 'fmp', call: callFMP },
  { name: 'finnhub', call: callFinnhub },
  { name: 'newsapi', call: callNewsAPI }
];

// Main API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    let response = '';
    let usedApi = '';

    // Try APIs in order until one works
    for (const api of apiCallingOrder) {
      try {
        // Check if we've hit rate limits for this API
        const today = new Date().toDateString();
        if (!apiUsage[today]) apiUsage[today] = {};
        if (!apiUsage[today][api.name]) apiUsage[today][api.name] = 0;
        
        // Simple rate limiting - adjust based on each API's limits
        if (apiUsage[today][api.name] > 50) { // Conservative limit
          continue; // Skip to next API
        }

        console.log(`Trying ${api.name} API...`);
        const apiResponse = await api.call(userMessage);
        apiUsage[today][api.name] += 1;
        
        response = `From ${api.name}: ${typeof apiResponse === 'string' ? apiResponse : JSON.stringify(apiResponse)}`;
        usedApi = api.name;
        break; // Stop after first successful API call
        
      } catch (error) {
        console.log(`${api.name} API failed:`, error.message);
        // Continue to next API
      }
    }

    if (!response) {
      response = 'All APIs are currently unavailable. Please try again later.';
    }

    res.json({ response, usedApi });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('API Keys Status:');
  Object.entries(API_KEYS).forEach(([name, key]) => {
    console.log(`${name}: ${key ? 'Configured' : 'Not configured'}`);
  });
});
