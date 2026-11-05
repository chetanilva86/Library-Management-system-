// ============================================
// routes/books.js - Book CRUD + Issue/Return
// ============================================

const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/books - Get all books (with optional search)
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { title:    { $regex: search, $options: 'i' } },
          { author:   { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: books.length, books });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/books - Add new book (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const copies = parseInt(req.body.totalCopies) || 1;
    const bookData = {
      ...req.body,
      totalCopies: copies,
      availableCopies: copies
    };

    const book = await Book.create(bookData);
    res.status(201).json({
      success: true,
      message: 'Book added successfully!',
      book
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/books/:id - Update book (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    res.json({ success: true, message: 'Book updated successfully!', book });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/books/:id - Delete book (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }
    res.json({ success: true, message: 'Book deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/books/:id/issue - Issue a book
router.post('/:id/issue', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No copies available right now.'
      });
    }

    // Check if already issued by this user
    const alreadyIssued = book.issuedTo.find(
      item => item.user.toString() === req.user._id.toString()
    );
    if (alreadyIssued) {
      return res.status(400).json({
        success: false,
        message: 'You have already issued this book.'
      });
    }

    // Due date = 14 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Update book
    book.availableCopies -= 1;
    book.issuedTo.push({ user: req.user._id, dueDate });
    await book.save();

    // Update user record
    await User.findByIdAndUpdate(req.user._id, {
      $push: { issuedBooks: { book: book._id, dueDate } }
    });

    res.json({
      success: true,
      message: `Book issued successfully! Due date: ${dueDate.toDateString()}`,
      dueDate
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/books/:id/return - Return a book
router.post('/:id/return', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const issuedEntry = book.issuedTo.find(
      item => item.user.toString() === req.user._id.toString()
    );
    if (!issuedEntry) {
      return res.status(400).json({
        success: false,
        message: 'You have not issued this book.'
      });
    }

    // Return book
    book.availableCopies += 1;
    book.issuedTo = book.issuedTo.filter(
      item => item.user.toString() !== req.user._id.toString()
    );
    await book.save();

    // Update user record
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { issuedBooks: { book: book._id } }
    });

    res.json({ success: true, message: 'Book returned successfully. Thank you!' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
