// ============================================
// js/dashboard.js - Dashboard Logic
// ============================================

const API = 'http://localhost:5000/api';

window.addEventListener('load', async () => {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) { window.location.href = 'login.html'; return; }

  // Set user info in navbar & welcome
  document.getElementById('navUser').textContent  = user.name;
  document.getElementById('userName').textContent = user.name;

  const pill = document.getElementById('rolePill');
  if (user.role === 'admin') {
    pill.textContent = '👑 Admin';
    pill.className   = 'role-pill role-admin';
    document.getElementById('welcomeSub').textContent = 'Manage books and monitor all users.';
    document.getElementById('myCountIcon').textContent = '👥';
    document.getElementById('myCountLabel').textContent = 'Total Users';
  } else {
    pill.textContent = '🎓 Student';
    pill.className   = 'role-pill role-student';
    document.getElementById('welcomeSub').textContent = 'Track your issued books and due dates.';
  }

  // Load stats
  await loadStats(user);

  // Load role-specific content
  if (user.role === 'admin') {
    document.getElementById('myBooksSection').style.display = 'none';
    document.getElementById('usersSection').style.display   = 'block';
    await loadUsers();
  } else {
    await loadMyBooks();
  }
});

// ========== STATS ==========
async function loadStats(user) {
  try {
    const res  = await fetch(`${API}/books`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();

    if (data.books) {
      const total     = data.books.length;
      const available = data.books.filter(b => b.availableCopies > 0).length;
      const issued    = data.books.reduce((s, b) => s + (b.totalCopies - b.availableCopies), 0);

      document.getElementById('totalBooksCount').textContent = total;
      document.getElementById('availableCount').textContent  = available;
      document.getElementById('issuedCount').textContent     = issued;
    }
  } catch (e) { console.log('Stats error:', e); }
}

// ========== MY BOOKS (Student) ==========
async function loadMyBooks() {
  const list = document.getElementById('myBooksList');

  try {
    const res  = await fetch(`${API}/auth/me`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    const books = data.user?.issuedBooks || [];

    document.getElementById('myCount').textContent = books.length;

    if (books.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No books issued yet</h3>
          <p>Head over to the Books page to find something to read.</p>
          <a href="books.html" class="btn btn-gold">Browse Books</a>
        </div>`;
      return;
    }

    list.innerHTML = books.map(item => {
      const due     = new Date(item.dueDate);
      const today   = new Date();
      const overdue = due < today;
      const days    = Math.ceil(Math.abs(due - today) / 86400000);

      return `
        <div class="issued-item">
          <div class="issued-item-info">
            <h4>📖 ${item.book?.title || 'Book'}</h4>
            <p>${item.book?.author ? 'by ' + item.book.author + ' · ' : ''}Due: ${due.toDateString()}</p>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap">
            <span class="${overdue ? 'overdue-badge' : 'ontime-badge'}">
              ${overdue ? `⚠️ Overdue ${days}d` : `✅ ${days}d left`}
            </span>
          </div>
        </div>`;
    }).join('');

  } catch (e) {
    list.innerHTML = `<p style="color:var(--text-muted); padding:1rem">Could not load your books.</p>`;
  }
}

// ========== ALL USERS (Admin) ==========
async function loadUsers() {
  const list = document.getElementById('usersList');

  try {
    const res  = await fetch(`${API}/users`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();

    if (!data.users || data.users.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><h3>No users found</h3></div>`;
      return;
    }

    document.getElementById('myCount').textContent  = data.users.length;
    document.getElementById('userCount').textContent = `${data.count} total`;

    list.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Books Issued</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          ${data.users.map((u, i) => `
            <tr>
              <td style="color:var(--text-muted)">${i + 1}</td>
              <td><strong>${u.name}</strong></td>
              <td style="color:var(--text-muted)">${u.email}</td>
              <td>
                <span class="${u.role === 'admin' ? 'role-pill role-admin' : 'role-pill role-student'}"
                  style="padding:3px 10px; font-size:0.78rem">
                  ${u.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                </span>
              </td>
              <td style="text-align:center">
                <strong style="color:var(--gold)">${u.issuedBooks?.length || 0}</strong>
              </td>
              <td style="color:var(--text-muted); font-size:0.85rem">
                ${new Date(u.createdAt).toLocaleDateString()}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

  } catch (e) {
    list.innerHTML = `<p style="color:var(--text-muted); padding:1rem">Could not load users.</p>`;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
