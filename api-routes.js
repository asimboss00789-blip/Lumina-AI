const express = require('express');
const router = express.Router();
const path = require('path');
const fetch = require('node-fetch'); // Make sure to install node-fetch v2
const { readJSON, writeJSON, truncateMessages } = require('./utils');

const conversationsPath = path.join(__dirname, 'conversations');

// Environment keys
const HUGGINGFACE_KEY = process.env.HUGGINGFACE_KEY;
const ALPHA_KEY = process.env.ALPHA_KEY;
const FMP_KEY = process.env.FMP_KEY;
const FINNHUB_KEY = process.env.FINNHUB_KEY;
const GROQ_KEY = process.env.GROQ_KEY;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

// --- Conversation routes ---

router.get('/conversations/:id', (req, res) => {
    const convoFile = path.join(conversationsPath, `${req.params.id}.json`);
    const messages = readJSON(convoFile);
    res.json(messages);
});

router.post('/conversations/:id', (req, res) => {
    const convoFile = path.join(conversationsPath, `${req.params.id}.json`);
    let messages = readJSON(convoFile);
    messages.push(req.body); // { sender, message, timestamp }
    messages = truncateMessages(messages); // keep last 50 messages
    writeJSON(convoFile, messages);
    res.json({ success: true, messages });
});

// --- API call route ---

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

        // Combine all responses into a single string
        const combinedAnswer = responses.join(' ');

        res.json({ success: true, result: combinedAnswer });
    } catch (err) {
        console.error(err);
        res.json({ success: false, result: 'Error calling APIs.' });
    }
});

// --- Individual API calls ---

async function callHuggingFace(input) {
    if (!HUGGINGFACE_KEY) return '';
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${HUGGINGFACE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: input })
    });
    const data = await response.json();
    return data?.[0]?.generated_text || '';
}

async function callAlpha(input) {
    if (!ALPHA_KEY) return '';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${input}&interval=5min&apikey=${ALPHA_KEY}`;
    const data = await fetch(url).then(r => r.json());
    return `Alpha: ${JSON.stringify(data).slice(0, 200)}`; // Short snippet
}

async function callFMP(input) {
    if (!FMP_KEY) return '';
    const url = `https://financialmodelingprep.com/api/v3/quote/${input}?apikey=${FMP_KEY}`;
    const data = await fetch(url).then(r => r.json());
    return `FMP: ${JSON.stringify(data).slice(0, 200)}`;
}

async function callFinnhub(input) {
    if (!FINNHUB_KEY) return '';
    const url = `https://finnhub.io/api/v1/quote?symbol=${input}&token=${FINNHUB_KEY}`;
    const data = await fetch(url).then(r => r.json());
    return `Finnhub: ${JSON.stringify(data).slice(0, 200)}`;
}

async function callGroq(input) {
    if (!GROQ_KEY) return '';
    // Placeholder endpoint, replace with your actual Groq API
    return `Groq response for "${input}"`;
}

async function callNewsAPI(input) {
    if (!NEWSAPI_KEY) return '';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(input)}&apiKey=${NEWSAPI_KEY}`;
    const data = await fetch(url).then(r => r.json());
    return `News: ${data?.articles?.[0]?.title || ''}`;
}

module.exports = router;
