// write.js

const apiBase = '/api'; // Base URL for API

let currentUser = 'guest'; // Default user; replace with logged-in user
let currentBook = null;

// Elements
const booksContainer = document.getElementById('books-container');
const pagesContainer = document.getElementById('pages-container');
const addBookBtn = document.getElementById('add-book-btn');
const pageTitleInput = document.getElementById('page-title');
const pageContentInput = document.getElementById('page-content');
const addPageBtn = document.getElementById('add-page-btn');

// Load books for user
async function loadBooks() {
    booksContainer.innerHTML = '';
    const res = await fetch(`${apiBase}/books/${currentUser}`);
    const books = await res.json();

    books.forEach(book => {
        const bookDiv = document.createElement('div');
        bookDiv.className = 'book-box';
        bookDiv.textContent = book.replace('.json', '');
        bookDiv.addEventListener('click', () => {
            currentBook = book.replace('.json', '');
            loadPages(currentBook);
        });
        booksContainer.appendChild(bookDiv);
    });
}

// Create a new book
addBookBtn.addEventListener('click', async () => {
    const bookName = prompt('Enter book name:');
    if (!bookName) return;
    await fetch(`${apiBase}/books/${currentUser}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookName })
    });
    currentBook = bookName;
    loadBooks();
    pagesContainer.innerHTML = '';
});

// Load pages for a book
async function loadPages(book) {
    pagesContainer.innerHTML = '';
    const res = await fetch(`${apiBase}/books/${currentUser}/${book}`);
    const pages = await res.json();
    
    pages.forEach((page, index) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-box';
        pageDiv.textContent = page.title;
        pageDiv.addEventListener('click', () => loadPageContent(index, page));
        pagesContainer.appendChild(pageDiv);
    });
}

// Load single page content
function loadPageContent(index, page) {
    pageTitleInput.value = page.title;
    pageContentInput.value = page.content;
    addPageBtn.onclick = () => savePage(index);
}

// Save or update page
async function savePage(index = null) {
    if (!currentBook) return alert('Select a book first!');
    const title = pageTitleInput.value;
    const content = pageContentInput.value;
    
    const res = await fetch(`${apiBase}/books/${currentUser}/${currentBook}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
    });
    
    if (res.ok) {
        alert('Page saved!');
        loadPages(currentBook);
        pageTitleInput.value = '';
        pageContentInput.value = '';
    } else {
        alert('Error saving page.');
    }
}

// Initial load
loadBooks();
