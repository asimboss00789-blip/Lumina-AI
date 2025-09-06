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
    messages = truncateMessages(messages, 50);
    writeJSON(convoFile, messages);
    res.json({ success: true, messages });
});

// POST: Call all 6 APIs at once
router.post('/api-call/all', async (req, res) => {
    const { input } = req.body;

    // Replace these with actual API calls
    const apiResponses = await Promise.all([
        fakeAPI('huggingface', input),
        fakeAPI('alpha', input),
        fakeAPI('fmp', input),
        fakeAPI('finnhub', input),
        fakeAPI('groq', input),
        fakeAPI('newsapi', input)
    ]);

    const combinedResult = apiResponses.join('\n\n'); // Combine responses
    res.json({ success: true, result: combinedResult });
});

// Example fake API function
async function fakeAPI(name, input) {
    // In reality, call the real API here
    return `Response from ${name}: processed "${input}"`;
}

module.exports = router;
