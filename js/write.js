// write.js

// Global user (replace with actual login system later)
let currentUser = "guest";

// DOM Elements
const booksContainer = document.getElementById("books-container");

// Load existing books for user
function loadBooks() {
    booksContainer.innerHTML = "";
    const userBooks = JSON.parse(localStorage.getItem(`books_${currentUser}`)) || [];
    userBooks.forEach((book, index) => {
        const bookEl = document.createElement("div");
        bookEl.className = "book-item";
        bookEl.dataset.index = index;
        bookEl.innerHTML = `
            <div class="book-title">${book.name}</div>
            <div class="pages-container"></div>
            <button class="delete-book">Delete Book</button>
            <button class="add-page">+</button>
        `;
        booksContainer.appendChild(bookEl);

        // Render pages
        const pagesContainer = bookEl.querySelector(".pages-container");
        book.pages.forEach((page, pageIndex) => {
            const pageEl = document.createElement("div");
            pageEl.className = "page-item";
            pageEl.dataset.index = pageIndex;
            pageEl.innerHTML = `
                <div class="page-title">${page.title}</div>
                <button class="delete-page">x</button>
            `;
            pagesContainer.appendChild(pageEl);
        });
    });
}

// Save books for user
function saveBooks(books) {
    localStorage.setItem(`books_${currentUser}`, JSON.stringify(books));
}

// Add new book
function addBook() {
    const name = prompt("Enter book name:");
    if (!name) return;

    const books = JSON.parse(localStorage.getItem(`books_${currentUser}`)) || [];
    books.push({ name, pages: [] });
    saveBooks(books);
    loadBooks();
}

// Delete book
function deleteBook(index) {
    const books = JSON.parse(localStorage.getItem(`books_${currentUser}`)) || [];
    books.splice(index, 1);
    saveBooks(books);
    loadBooks();
}

// Add page to a book
function addPage(bookIndex) {
    const title = prompt("Enter page title:");
    if (!title) return;

    const books = JSON.parse(localStorage.getItem(`books_${currentUser}`)) || [];
    books[bookIndex].pages.push({ title, content: "" });
    saveBooks(books);
    loadBooks();
}

// Delete page
function deletePage(bookIndex, pageIndex) {
    const books = JSON.parse(localStorage.getItem(`books_${currentUser}`)) || [];
    books[bookIndex].pages.splice(pageIndex, 1);
    saveBooks(books);
    loadBooks();
}

// Event delegation for dynamic elements
booksContainer.addEventListener("click", (e) => {
    const bookEl = e.target.closest(".book-item");
    if (!bookEl) return;
    const bookIndex = parseInt(bookEl.dataset.index);

    if (e.target.classList.contains("add-page")) {
        addPage(bookIndex);
    }

    if (e.target.classList.contains("delete-book")) {
        if (confirm("Delete this book?")) deleteBook(bookIndex);
    }

    if (e.target.classList.contains("delete-page")) {
        const pageEl = e.target.closest(".page-item");
        const pageIndex = parseInt(pageEl.dataset.index);
        if (confirm("Delete this page?")) deletePage(bookIndex, pageIndex);
    }
});

// Initialize
document.getElementById("add-book").addEventListener("click", addBook);
loadBooks();
