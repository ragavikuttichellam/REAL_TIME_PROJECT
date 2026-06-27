const express = require('express');
const router = express.Router();
const {
  getQuestions,
  checkAnswer,
  getTopics,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { protect, adminOnly } = require('../middleware/auth');

// Public-ish (requires login)
router.get('/', protect, getQuestions);
router.get('/topics', protect, getTopics);
router.post('/check', protect, checkAnswer);

// Admin only
router.post('/', protect, adminOnly, createQuestion);
router.put('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);

module.exports = router;
