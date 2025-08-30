// script.js

// DOM Elements
const booksContainer = document.getElementById('books-container'); // The book boxes
const pagesContainer = document.getElementById('pages-container'); // Page navigation container
const pageTitleInput = document.getElementById('page-title'); // Input for page title
const pageContentArea = document.getElementById('page-content'); // Textarea for content
const addPageButton = document.getElementById('add-page-btn'); // "+" button for new page
const bookTitleInput = document.getElementById('new-book-title'); // New book input
const createBookButton = document.getElementById('create-book-btn'); // Create book button

let currentBook = null;
let currentPageNumber = 1;

// Initialize UI
function init() {
    renderBooks();
    setupEventListeners();
}

// Render all books
function renderBooks() {
    booksContainer.innerHTML = '';
    const books = listUserBooks();
    books.forEach(bookName => {
        const box = document.createElement('div');
        box.className = 'book-box';
        box.textContent = bookName;
        box.addEventListener('click', () => openBook(bookName));
        booksContainer.appendChild(box);
    });

    // Add the "+" box for creating new book
    const addBox = document.createElement('div');
    addBox.className = 'book-box add-book';
    addBox.textContent = '+';
    addBox.addEventListener('click', () => showNewBookInput());
    booksContainer.appendChild(addBox);
}

// Show input for new book
function showNewBookInput() {
    const name = prompt('Enter book name:');
    if (!name) return;
    createBook(name);
    renderBooks();
}

// Open a book
function openBook(bookName) {
    currentBook = bookName;
    currentPageNumber = 1;
    renderPages();
    loadPageToEditor(currentPageNumber);
}

// Render pages for current book
function renderPages() {
    pagesContainer.innerHTML = '';
    const pages = getAllPages(currentBook);
    pages.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = `Page ${p.pageNumber}`;
        btn.addEventListener('click', () => {
            currentPageNumber = p.pageNumber;
            loadPageToEditor(currentPageNumber);
        });
        pagesContainer.appendChild(btn);
    });

    // Add "+" button for new page
    const addBtn = document.createElement('button');
    addBtn.className = 'page-btn add-page-btn';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => addNewPage());
    pagesContainer.appendChild(addBtn);
}

// Load a page content to editor
function loadPageToEditor(pageNumber) {
    const page = loadPage(currentBook, pageNumber);
    pageTitleInput.value = page ? page.title || '' : '';
    pageContentArea.value = page ? page.content : '';
}

// Add a new page
function addNewPage() {
    saveCurrentPage();
    currentPageNumber = getAllPages(currentBook).length + 1;
    renderPages();
    pageTitleInput.value = '';
    pageContentArea.value = '';
}

// Save current page
function saveCurrentPage() {
    if (!currentBook) return;
    const content = pageContentArea.value;
    const title = pageTitleInput.value || `Page ${currentPageNumber}`;
    const pageData = { title, content };
    savePage(currentBook, currentPageNumber, pageData);
}

// Event listeners
function setupEventListeners() {
    addPageButton.addEventListener('click', addNewPage);

    pageContentArea.addEventListener('input', () => {
        saveCurrentPage();
    });

    pageTitleInput.addEventListener('input', () => {
        saveCurrentPage();
    });
}

// Start
init();
