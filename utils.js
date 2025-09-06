const fs = require('fs');
const path = require('path');

// Read JSON from file
function readJSON(filePath) {
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error('Error reading JSON:', err);
        return [];
    }
}

// Write JSON to file
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error writing JSON:', err);
    }
}

// Keep last 50 messages
function truncateMessages(messages, limit = 50) {
    if (messages.length > limit) {
        return messages.slice(-limit);
    }
    return messages;
}

module.exports = { readJSON, writeJSON, truncateMessages };
