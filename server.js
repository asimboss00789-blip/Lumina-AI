const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, ''))); // Serve root static files

// Ensure folders exist
const folders = ['books', 'users', 'conversations'];
folders.forEach(f => {
    if (!fs.existsSync(f)) fs.mkdirSync(f, { recursive: true });
});

// API Routes

// Get list of books for a user
app.get('/api/books/:user', (req, res) => {
    const user = req.params.user;
    const userDir = path.join('users', user, 'books');
    if (!fs.existsSync(userDir)) return res.json([]);
    const books = fs.readdirSync(userDir);
    res.json(books);
});

// Create a new book
app.post('/api/books/:user', (req, res) => {
    const user = req.params.user;
    const { bookName } = req.body;
    const userDir = path.join('users', user, 'books');
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    const bookPath = path.join(userDir, `${bookName}.json`);
    if (fs.existsSync(bookPath)) return res.status(400).json({ error: 'Book already exists' });
    fs.writeFileSync(bookPath, JSON.stringify({ pages: [] }));
    res.json({ success: true });
});

// Add page to book
app.post('/api/books/:user/:book', (req, res) => {
    const user = req.params.user;
    const book = req.params.book;
    const { title, content } = req.body;
    const bookPath = path.join('users', user, 'books', `${book}.json`);
    if (!fs.existsSync(bookPath)) return res.status(404).json({ error: 'Book not found' });
    const bookData = JSON.parse(fs.readFileSync(bookPath));
    bookData.pages.push({ title, content });
    fs.writeFileSync(bookPath, JSON.stringify(bookData));
    res.json({ success: true });
});

// Get pages of a book
app.get('/api/books/:user/:book', (req, res) => {
    const user = req.params.user;
    const book = req.params.book;
    const bookPath = path.join('users', user, 'books', `${book}.json`);
    if (!fs.existsSync(bookPath)) return res.status(404).json({ error: 'Book not found' });
    const bookData = JSON.parse(fs.readFileSync(bookPath));
    res.json(bookData.pages);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
