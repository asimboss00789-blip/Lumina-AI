const fs = require('fs');
const path = require('path');

// Truncate messages to max 50 per conversation
function truncateMessages(messages) {
    if (messages.length > 50) {
        return messages.slice(messages.length - 50);
    }
    return messages;
}

// Auto-delete old conversations (older than 3 days)
function autoDeleteOldConversations(conversationsPath) {
    const files = fs.readdirSync(conversationsPath);
    const now = Date.now();
    files.forEach(file => {
        const filePath = path.join(conversationsPath, file);
        const stats = fs.statSync(filePath);
        if ((now - stats.mtimeMs) > 3 * 24 * 60 * 60 * 1000) { // 3 days
            fs.unlinkSync(filePath);
        }
    });
}

// Read JSON file safely
function readJSON(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
}

// Write JSON file safely
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { truncateMessages, autoDeleteOldConversations, readJSON, writeJSON };
