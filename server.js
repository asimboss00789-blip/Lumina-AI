// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./api-routes');
const { truncateMessages, autoDeleteOldConversations, readJSON, writeJSON } = require('./utils');
const { assignAnonymousID } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const conversationsPath = path.join(__dirname, 'conversations');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(assignAnonymousID);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '/'))); // serves index.html, css/, js/, etc.

// API routes
app.use('/api', apiRoutes);

// Auto-delete old conversations every 12 hours
setInterval(() => {
    autoDeleteOldConversations(conversationsPath);
}, 12 * 60 * 60 * 1000); // every 12 hours

// Placeholder: Example route to call your 6 APIs
app.post('/api/call/:service', async (req, res) => {
    const { service } = req.params;
    const { input } = req.body;

    try {
        let result = '';

        switch(service.toLowerCase()) {
            case 'huggingface':
                // Example: call Hugging Face API
                result = `HuggingFace response for "${input}"`;
                break;
            case 'alpha':
                result = `Alpha Vantage response for "${input}"`;
                break;
            case 'fmp':
                result = `FMP response for "${input}"`;
                break;
            case 'finnhub':
                result = `Finnhub response for "${input}"`;
                break;
            case 'groq':
                result = `Groq response for "${input}"`;
                break;
            case 'newsapi':
                result = `NewsAPI response for "${input}"`;
                break;
            default:
                result = `Unknown service: ${service}`;
        }

        res.json({ success: true, result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'API call failed' });
    }
});

// Catch-all route to serve index.html for frontend routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('API keys loaded:', {
        huggingface: !!process.env.HUGGINGFACE_KEY,
        alpha: !!process.env.ALPHA_KEY,
        fmp: !!process.env.FMP_KEY,
        finnhub: !!process.env.FINNHUB_KEY,
        groq: !!process.env.GROQ_KEY,
        newsapi: !!process.env.NEWSAPI_KEY
    });
});
