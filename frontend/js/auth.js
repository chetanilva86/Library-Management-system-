// ============================================
// js/auth.js - Login & Register Logic
// ============================================

const API = 'http://localhost:5000/api';

// Show alert message
function showAlert(message, type) {
  const el = document.getElementById('alert');
  el.textContent = message;
  el.className = `alert ${type}`;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

// ========== LOGIN ==========
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn      = document.getElementById('submitBtn');

    btn.textContent = 'Signing in...';
    btn.disabled = true;

    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 900);
      } else {
        showAlert(data.message || 'Login failed. Try again.', 'error');
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }

    } catch (err) {
      showAlert('Cannot connect to server. Make sure backend is running!', 'error');
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
}

// ========== REGISTER ==========
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role     = document.getElementById('role').value;
    const btn      = document.getElementById('submitBtn');

    btn.textContent = 'Creating account...';
    btn.disabled = true;

    try {
      const res  = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showAlert('Account created! Redirecting...', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 900);
      } else {
        showAlert(data.message || 'Registration failed. Try again.', 'error');
        btn.textContent = 'Create Account';
        btn.disabled = false;
      }

    } catch (err) {
      showAlert('Cannot connect to server. Make sure backend is running!', 'error');
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  });
}

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
