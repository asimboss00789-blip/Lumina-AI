// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve root and all folders

// Users and books folder paths
const USERS_DIR = path.join(__dirname, 'users');
const BOOKS_DIR = path.join(__dirname, 'books');

// Ensure folders exist
if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR);
if (!fs.existsSync(BOOKS_DIR)) fs.mkdirSync(BOOKS_DIR);

// Save book/page data
app.post('/save', (req, res) => {
    const { username, bookName, pageName, content } = req.body;
    if (!username || !bookName || !pageName || content === undefined) {
        return res.status(400).json({ error: 'Missing data' });
    }

    const userDir = path.join(BOOKS_DIR, username);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir);

    const bookDir = path.join(userDir, bookName);
    if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir);

    const filePath = path.join(bookDir, pageName + '.json');
    fs.writeFileSync(filePath, JSON.stringify({ content }, null, 2));

    res.json({ success: true, file: filePath });
});

// Load book/page data
app.get('/load', (req, res) => {
    const { username, bookName, pageName } = req.query;
    if (!username || !bookName || !pageName) {
        return res.status(400).json({ error: 'Missing data' });
    }

    const filePath = path.join(BOOKS_DIR, username, bookName, pageName + '.json');
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({ content: data.content });
});

// Delete a page
app.post('/delete-page', (req, res) => {
    const { username, bookName, pageName } = req.body;
    if (!username || !bookName || !pageName) return res.status(400).json({ error: 'Missing data' });

    const filePath = path.join(BOOKS_DIR, username, bookName, pageName + '.json');
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ success: true });
    } else {
        return res.status(404).json({ error: 'File not found' });
    }
});

// Delete a book
app.post('/delete-book', (req, res) => {
    const { username, bookName } = req.body;
    if (!username || !bookName) return res.status(400).json({ error: 'Missing data' });

    const bookDir = path.join(BOOKS_DIR, username, bookName);
    if (fs.existsSync(bookDir)) {
        fs.rmSync(bookDir, { recursive: true, force: true });
        return res.json({ success: true });
    } else {
        return res.status(404).json({ error: 'Book not found' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
