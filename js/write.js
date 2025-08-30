// write.js
document.addEventListener("DOMContentLoaded", () => {
    const booksContainer = document.getElementById("booksContainer");
    const newBookBtn = document.getElementById("newBookBtn");

    // Load existing books from storage
    let books = Storage.loadBooks() || [];

    function renderBooks() {
        booksContainer.innerHTML = "";
        books.forEach((book, index) => {
            const bookEl = document.createElement("div");
            bookEl.className = "book-box";
            bookEl.innerHTML = `
                <div class="book-title">${book.title}</div>
                <button class="open-book">Open</button>
                <button class="delete-book">🗑️</button>
            `;
            booksContainer.appendChild(bookEl);

            // Open book to edit pages
            bookEl.querySelector(".open-book").addEventListener("click", () => openBook(index));

            // Delete book
            bookEl.querySelector(".delete-book").addEventListener("click", () => {
                if (confirm(`Delete book "${book.title}"?`)) {
                    books.splice(index, 1);
                    Storage.saveBooks(books);
                    renderBooks();
                }
            });
        });
    }

    function openBook(bookIndex) {
        const book = books[bookIndex];
        let pageIndex = 0;

        function renderPage() {
            booksContainer.innerHTML = `
                <div class="page-editor">
                    <input type="text" id="pageTitle" placeholder="Page Title" value="${book.pages[pageIndex]?.title || ""}">
                    <textarea id="pageContent" placeholder="Write your page here...">${book.pages[pageIndex]?.content || ""}</textarea>
                    <div class="page-controls">
                        <button id="prevPage">◀ Prev</button>
                        <button id="nextPage">Next ▶</button>
                        <button id="addPage">+ Add Page</button>
                        <button id="deletePage">🗑️ Delete Page</button>
                        <button id="backBooks">⬅ Back to Books</button>
                    </div>
                </div>
            `;

            const titleInput = document.getElementById("pageTitle");
            const contentInput = document.getElementById("pageContent");

            // Save current page on change
            titleInput.addEventListener("input", () => {
                book.pages[pageIndex] = book.pages[pageIndex] || {};
                book.pages[pageIndex].title = titleInput.value;
                Storage.saveBooks(books);
            });

            contentInput.addEventListener("input", () => {
                book.pages[pageIndex] = book.pages[pageIndex] || {};
                book.pages[pageIndex].content = contentInput.value;
                Storage.saveBooks(books);
            });

            // Page navigation
            document.getElementById("prevPage").addEventListener("click", () => {
                if (pageIndex > 0) {
                    pageIndex--;
                    renderPage();
                }
            });

            document.getElementById("nextPage").addEventListener("click", () => {
                if (pageIndex < book.pages.length - 1) {
                    pageIndex++;
                    renderPage();
                }
            });

            document.getElementById("addPage").addEventListener("click", () => {
                book.pages.push({ title: "", content: "" });
                pageIndex = book.pages.length - 1;
                Storage.saveBooks(books);
                renderPage();
            });

            document.getElementById("deletePage").addEventListener("click", () => {
                if (confirm("Delete this page?")) {
                    book.pages.splice(pageIndex, 1);
                    if (pageIndex > 0) pageIndex--;
                    Storage.saveBooks(books);
                    renderPage();
                }
            });

            document.getElementById("backBooks").addEventListener("click", renderBooks);
        }

        if (!book.pages) book.pages = [];
        renderPage();
    }

    newBookBtn.addEventListener("click", () => {
        const title = prompt("Enter new book title:");
        if (title) {
            books.push({ title, pages: [] });
            Storage.saveBooks(books);
            renderBooks();
        }
    });

    renderBooks();
});
