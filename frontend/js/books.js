// ============================================
// js/books.js - Books Page Logic
// ============================================

const API = 'http://localhost:5000/api';

// Check login on page load
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('navUser').textContent = user.name || '';

  // Show admin panel if admin
  if (user.role === 'admin') {
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('addBookForm').addEventListener('submit', addBook);
  }

  loadBooks();

  // Search on Enter
  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBooks();
  });
});

// ========== LOAD BOOKS ==========
async function loadBooks(search = '') {
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = `<div class="loading"><div class="loading-spinner"></div><p>Loading books...</p></div>`;

  try {
    const url = search
      ? `${API}/books?search=${encodeURIComponent(search)}`
      : `${API}/books`;

    const res  = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (res.status === 401) { window.location.href = 'login.html'; return; }

    const data = await res.json();

    if (!data.books || data.books.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📭</div>
          <h3>No books found</h3>
          <p>${search ? 'No results for "' + search + '"' : 'No books have been added yet.'}</p>
          ${search ? `<button onclick="loadBooks()" class="btn btn-ghost">Clear Search</button>` : ''}
        </div>`;
      return;
    }

    renderBooks(data.books);

  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Connection Error</h3>
        <p>Cannot reach the server. Make sure backend is running on port 5000.</p>
      </div>`;
  }
}

// ========== RENDER BOOKS ==========
function renderBooks(books) {
  const user   = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const grid   = document.getElementById('booksGrid');

  grid.innerHTML = books.map(book => {
    const available     = book.availableCopies > 0;
    const alreadyIssued = book.issuedTo && book.issuedTo.some(i => i.user === user.id);

    return `
      <div class="book-card">
        <div class="book-category">${safe(book.category)}</div>
        <h3>${safe(book.title)}</h3>
        <p class="author">by ${safe(book.author)}${book.isbn ? ` &nbsp;·&nbsp; ISBN: ${safe(book.isbn)}` : ''}</p>

        <div class="book-meta">
          <span class="badge ${available ? 'badge-available' : 'badge-unavailable'}">
            ${available ? '● Available' : '● Unavailable'}
          </span>
          <span class="badge badge-copies">${book.availableCopies}/${book.totalCopies} copies</span>
        </div>

        ${book.description ? `<p class="book-desc">${safe(book.description)}</p>` : ''}

        <div class="book-actions">
          ${!isAdmin ? `
            ${alreadyIssued
              ? `<button class="btn btn-ghost" onclick="returnBook('${book._id}')">📥 Return</button>`
              : `<button class="btn btn-success-soft" onclick="issueBook('${book._id}')"
                   ${!available ? 'disabled' : ''}>
                   📤 Issue Book
                 </button>`
            }
          ` : ''}

          ${isAdmin ? `
            <button class="btn btn-ghost"
              onclick="editBook('${book._id}','${safe(book.title)}','${safe(book.author)}','${safe(book.category)}',${book.totalCopies})">
              ✏️ Edit
            </button>
            <button class="btn btn-danger-soft" onclick="deleteBook('${book._id}')">🗑️ Delete</button>
          ` : ''}
        </div>
      </div>`;
  }).join('');
}

// ========== ISSUE BOOK ==========
async function issueBook(id) {
  if (!confirm('Issue this book? It will be due in 14 days.')) return;

  try {
    const res  = await fetch(`${API}/books/${id}/issue`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) loadBooks();
  } catch { alert('Error. Please try again.'); }
}

// ========== RETURN BOOK ==========
async function returnBook(id) {
  if (!confirm('Return this book?')) return;

  try {
    const res  = await fetch(`${API}/books/${id}/return`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) loadBooks();
  } catch { alert('Error. Please try again.'); }
}

// ========== ADD BOOK (Admin) ==========
async function addBook(e) {
  e.preventDefault();
  const btn    = document.getElementById('addBookBtn');
  btn.textContent = 'Adding...';
  btn.disabled = true;

  const copies = parseInt(document.getElementById('bookCopies').value) || 1;

  try {
    const res  = await fetch(`${API}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        title:           document.getElementById('bookTitle').value.trim(),
        author:          document.getElementById('bookAuthor').value.trim(),
        isbn:            document.getElementById('bookISBN').value.trim() || undefined,
        category:        document.getElementById('bookCategory').value.trim(),
        totalCopies:     copies,
        availableCopies: copies,
        description:     document.getElementById('bookDesc').value.trim()
      })
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) { e.target.reset(); loadBooks(); }
  } catch { alert('Error adding book.'); }

  btn.textContent = '+ Add Book';
  btn.disabled = false;
}

// ========== EDIT BOOK (Admin) ==========
async function editBook(id, title, author, category, copies) {
  const t = prompt('Title:', title);     if (t === null) return;
  const a = prompt('Author:', author);   if (a === null) return;
  const c = prompt('Category:', category); if (c === null) return;
  const n = prompt('Total Copies:', copies); if (n === null) return;

  try {
    const res  = await fetch(`${API}/books/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ title: t, author: a, category: c, totalCopies: parseInt(n) })
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) loadBooks();
  } catch { alert('Error updating book.'); }
}

// ========== DELETE BOOK (Admin) ==========
async function deleteBook(id) {
  if (!confirm('Permanently delete this book?')) return;

  try {
    const res  = await fetch(`${API}/books/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) loadBooks();
  } catch { alert('Error deleting book.'); }
}

// ========== SEARCH ==========
function searchBooks() {
  const q = document.getElementById('searchInput').value.trim();
  loadBooks(q);
}

// ========== HELPERS ==========
function safe(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
