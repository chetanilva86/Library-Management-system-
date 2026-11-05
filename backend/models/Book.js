// ============================================
// models/Book.js - Book Schema
// ============================================

const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  totalCopies: {
    type: Number,
    default: 1,
    min: 1
  },
  availableCopies: {
    type: Number,
    default: 1,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  issuedTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issuedDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);
