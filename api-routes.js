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
        // Replace these with real API calls
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
        res.json({ success: false, result: 'Error calling APIs.' });
    }
});

// Dummy placeholder functions (replace with your actual API calls)
async function callHuggingFace(input) { return `Response from HuggingFace for "${input}"`; }
async function callAlpha(input) { return `Response from Alpha for "${input}"`; }
async function callFMP(input) { return `Response from FMP for "${input}"`; }
async function callFinnhub(input) { return `Response from Finnhub for "${input}"`; }
async function callGroq(input) { return `Response from Groq for "${input}"`; }
async function callNewsAPI(input) { return `Response from NewsAPI for "${input}"`; }

module.exports = router;
