// write.js

// ======= CONFIGURATION =======
const booksContainer = document.getElementById('books-container');
const currentUser = sessionStorage.getItem('currentUser') || 'guest'; // adjust with your login
const booksFolder = `books/${currentUser}`; // Each user has their own folder

// ======= HELPER FUNCTIONS =======

// Fetch all books for this user
async function loadBooks() {
    // Create user folder if doesn't exist
    await ensureUserFolder();

    const response = await fetch(`${booksFolder}/index.json`).catch(() => null);
    let books = [];
    if (response && response.ok) {
        books = await response.json();
    }
    renderBooks(books);
}

// Ensure the user's folder and index file exist
async function ensureUserFolder() {
    // Simulate folder creation in static context
    const indexExists = await fetch(`${booksFolder}/index.json`).then(r => r.ok).catch(() => false);
    if (!indexExists) {
        await saveJSON(`${booksFolder}/index.json`, []);
    }
}

// Save JSON file to "server"
async function saveJSON(path, data) {
    // For real deployment you need API endpoint to save JSON
    await fetch(`/save-json`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ path, data })
    });
}

// Load JSON file
async function loadJSON(path) {
    const response = await fetch(path).catch(() => null);
    if (response && response.ok) return await response.json();
    return null;
}

// ======= RENDERING =======

function renderBooks(books) {
    booksContainer.innerHTML = ''; // Clear existing

    books.forEach((book, bookIndex) => {
        const bookBox = document.createElement('div');
        bookBox.className = 'book-box';
        bookBox.innerHTML = `
            <div class="book-header">
                <span class="book-title">${book.name}</span>
                <button class="delete-book">🗑️</button>
            </div>
            <div class="pages-container"></div>
            <button class="add-page">+ Page</button>
        `;

        const pagesContainer = bookBox.querySelector('.pages-container');
        book.pages.forEach((page, pageIndex) => {
            const pageBox = document.createElement('div');
            pageBox.className = 'page-box';
            pageBox.innerHTML = `
                <span class="page-title">${page.title}</span>
                <button class="delete-page">🗑️</button>
            `;
            pageBox.addEventListener('click', () => openPage(bookIndex, pageIndex));
            pageBox.querySelector('.delete-page').addEventListener('click', e => {
                e.stopPropagation();
                deletePage(bookIndex, pageIndex);
            });
            pagesContainer.appendChild(pageBox);
        });

        bookBox.querySelector('.delete-book').addEventListener('click', () => deleteBook(bookIndex));
        bookBox.querySelector('.add-page').addEventListener('click', () => addPage(bookIndex));
        booksContainer.appendChild(bookBox);
    });

    // Add "New Book" button at the end
    const newBookBtn = document.createElement('button');
    newBookBtn.id = 'add-book';
    newBookBtn.textContent = '+ Book';
    newBookBtn.addEventListener('click', createBook);
    booksContainer.appendChild(newBookBtn);
}

// ======= CRUD FUNCTIONS =======

async function createBook() {
    const bookName = prompt('Enter new book name:');
    if (!bookName) return;

    const books = await loadJSON(`${booksFolder}/index.json`) || [];
    const newBook = { name: bookName, pages: [] };
    books.push(newBook);
    await saveJSON(`${booksFolder}/index.json`, books);
    renderBooks(books);
}

async function deleteBook(bookIndex) {
    if (!confirm('Delete this book?')) return;
    const books = await loadJSON(`${booksFolder}/index.json`);
    books.splice(bookIndex, 1);
    await saveJSON(`${booksFolder}/index.json`, books);
    renderBooks(books);
}

async function addPage(bookIndex) {
    const pageTitle = prompt('Enter page title:');
    if (!pageTitle) return;
    const books = await loadJSON(`${booksFolder}/index.json`);
    books[bookIndex].pages.push({ title: pageTitle, content: '' });
    await saveJSON(`${booksFolder}/index.json`, books);
    renderBooks(books);
}

async function deletePage(bookIndex, pageIndex) {
    if (!confirm('Delete this page?')) return;
    const books = await loadJSON(`${booksFolder}/index.json`);
    books[bookIndex].pages.splice(pageIndex, 1);
    await saveJSON(`${booksFolder}/index.json`, books);
    renderBooks(books);
}

async function openPage(bookIndex, pageIndex) {
    const books = await loadJSON(`${booksFolder}/index.json`);
    const page = books[bookIndex].pages[pageIndex];

    const pageContent = prompt(`Editing page: ${page.title}`, page.content);
    if (pageContent !== null) {
        books[bookIndex].pages[pageIndex].content = pageContent;
        await saveJSON(`${booksFolder}/index.json`, books);
        renderBooks(books);
    }
}

// ======= INIT =======
loadBooks();
