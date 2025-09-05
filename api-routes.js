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
    messages.push(req.body); // req.body should contain { sender, message, timestamp }
    messages = truncateMessages(messages);
    writeJSON(convoFile, messages);
    res.json({ success: true, messages });
});

// Placeholder: Call one of your 6 APIs (example structure)
router.post('/api-call/:service', async (req, res) => {
    const { service } = req.params;
    const { input } = req.body;

    // Example: you will replace with actual API calls
    let result = `Response from ${service} for input: ${input}`;

    res.json({ success: true, result });
});

module.exports = router;
