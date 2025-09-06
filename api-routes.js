const express = require('express');
const router = express.Router();
const path = require('path');
const { readJSON, writeJSON, truncateMessages } = require('./utils');

const conversationsPath = path.join(__dirname, 'conversations');

// GET conversation by ID
router.get('/conversations/:id', (req, res) => {
    const convoFile = path.join(conversationsPath, `${req.params.id}.json`);
    const messages = readJSON(convoFile);
    res.json(messages);
});

// POST a new message
router.post('/conversations/:id', (req, res) => {
    const convoFile = path.join(conversationsPath, `${req.params.id}.json`);
    let messages = readJSON(convoFile);
    messages.push(req.body); // { sender, message, timestamp }
    messages = truncateMessages(messages); // keep last 50 messages
    writeJSON(convoFile, messages);
    res.json({ success: true, messages });
});

// POST all APIs at once
router.post('/api-call/all', async (req, res) => {
    const { input } = req.body;

    try {
        const responses = await Promise.all([
            callHuggingFace(input),
            callAlpha(input),
            callFMP(input),
            callFinnhub(input),
            callGroq(input),
            callNewsAPI(input)
        ]);

        // Combine all API results into one answer
        const combinedAnswer = responses.join(' ');

        res.json({ success: true, result: combinedAnswer });
    } catch (err) {
        console.error(err);
        res.json({ success: false, result: 'Error calling APIs.' });
    }
});

// Helper functions calling real APIs from environment variables
async function callHuggingFace(input) {
    const key = process.env.HUGGINGFACE_KEY;
    if (!key) return 'HuggingFace API key missing.';
    const response = await fetch('https://api-inference.huggingface.co/models/your-model', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: input })
    });
    const data = await response.json();
    return data?.[0]?.generated_text || 'No response from HuggingFace';
}

async function callAlpha(input) {
    const key = process.env.ALPHA_KEY;
    return `Alpha response placeholder for "${input}"`; // Replace with real API call
}

async function callFMP(input) {
    const key = process.env.FMP_KEY;
    return `FMP response placeholder for "${input}"`; // Replace with real API call
}

async function callFinnhub(input) {
    const key = process.env.FINNHUB_KEY;
    return `Finnhub response placeholder for "${input}"`; // Replace with real API call
}

async function callGroq(input) {
    const key = process.env.GROQ_KEY;
    return `Groq response placeholder for "${input}"`; // Replace with real API call
}

async function callNewsAPI(input) {
    const key = process.env.NEWSAPI_KEY;
    return `NewsAPI response placeholder for "${input}"`; // Replace with real API call
}

module.exports = router;
