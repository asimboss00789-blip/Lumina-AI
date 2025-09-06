const express = require('express');
const router = express.Router();
const path = require('path');
const fetch = require('node-fetch'); // Node-fetch v2
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

// POST: call all APIs at once
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

        // Combine all results into one answer
        const combinedAnswer = responses.join(' ');

        res.json({ success: true, result: combinedAnswer });
    } catch (err) {
        console.error(err);
        res.json({ success: false, result: 'Error connecting to APIs.' });
    }
});

// === API CALL FUNCTIONS ===
async function callHuggingFace(input) {
    const key = process.env.HUGGINGFACE_KEY;
    if (!key) return '';
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: input })
    });
    const data = await response.json();
    return data?.[0]?.generated_text || '';
}

async function callAlpha(input) {
    const key = process.env.ALPHA_KEY;
    if (!key) return '';
    // Example: fetch data from Alpha Vantage (replace with your desired endpoint)
    return `Alpha processed: "${input}"`;
}

async function callFMP(input) {
    const key = process.env.FMP_KEY;
    if (!key) return '';
    // Example: fetch data from FMP
    return `FMP processed: "${input}"`;
}

async function callFinnhub(input) {
    const key = process.env.FINNHUB_KEY;
    if (!key) return '';
    // Example: fetch data from Finnhub
    return `Finnhub processed: "${input}"`;
}

async function callGroq(input) {
    const key = process.env.GROQ_KEY;
    if (!key) return '';
    // Example: fetch data from Groq
    return `Groq processed: "${input}"`;
}

async function callNewsAPI(input) {
    const key = process.env.NEWSAPI_KEY;
    if (!key) return '';
    // Example: fetch data from NewsAPI
    return `NewsAPI processed: "${input}"`;
}

module.exports = router;
