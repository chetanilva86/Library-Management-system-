// ============================================
// routes/users.js - User Management (Admin)
// ============================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users - Get all users (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('issuedBooks.book', 'title author');

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
