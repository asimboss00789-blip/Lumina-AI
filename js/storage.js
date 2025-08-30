// storage.js

// Helper to get the current logged-in user
function getCurrentUser() {
    // Replace with your real login system
    return localStorage.getItem('currentUser') || 'guest';
}

// Path helper for a user's books
function getUserBookPath(bookName) {
    const user = getCurrentUser();
    return `books/${user}/${bookName}`;
}

// Save a page for a specific book
function savePage(bookName, pageNumber, content) {
    const path = getUserBookPath(bookName);
    const filename = `${path}/page-${pageNumber}.json`;

    const data = {
        pageNumber: pageNumber,
        content: content,
        timestamp: new Date().toISOString()
    };

    // Save JSON to localStorage for now (replace with real filesystem API if needed)
    const storageKey = `${filename}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log(`Saved page ${pageNumber} of book "${bookName}" for user ${getCurrentUser()}`);
}

// Load a page
function loadPage(bookName, pageNumber) {
    const path = getUserBookPath(bookName);
    const filename = `${path}/page-${pageNumber}.json`;
    const storageKey = `${filename}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
}

// Get all pages for a book
function getAllPages(bookName) {
    const pages = [];
    let pageNumber = 1;
    while (true) {
        const page = loadPage(bookName, pageNumber);
        if (!page) break;
        pages.push(page);
        pageNumber++;
    }
    return pages;
}

// Save a new book (creates empty structure)
function createBook(bookName) {
    const user = getCurrentUser();
    const userBooksKey = `books/${user}/_booksList`;
    let books = JSON.parse(localStorage.getItem(userBooksKey)) || [];
    if (!books.includes(bookName)) {
        books.push(bookName);
        localStorage.setItem(userBooksKey, JSON.stringify(books));
        console.log(`Created new book "${bookName}" for user ${user}`);
    }
}

// List all books for current user
function listUserBooks() {
    const user = getCurrentUser();
    const userBooksKey = `books/${user}/_booksList`;
    const books = JSON.parse(localStorage.getItem(userBooksKey)) || [];
    return books;
}
