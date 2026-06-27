const Question = require('../models/Question');

// @route   GET /api/questions
// @desc    Get all questions (admin) or random session set (user)
// @access  Private
const getQuestions = async (req, res) => {
  try {
    const { topic, type, difficulty, limit = 15 } = req.query;

    const filter = { isActive: true };
    if (topic) filter.topic = topic;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    // Fetch all matching, then shuffle in memory for randomness
    const all = await Question.find(filter).select('-answer'); // hide answer
    const shuffled = all.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      count: selected.length,
      questions: selected,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/questions/check
// @desc    Check a single answer
// @access  Private
const checkAnswer = async (req, res) => {
  try {
    const { questionId, selectedOption } = req.body;

    if (!questionId || !selectedOption) {
      return res.status(400).json({
        success: false,
        message: 'questionId and selectedOption are required.',
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    const isCorrect = question.answer === selectedOption;

    res.status(200).json({
      success: true,
      isCorrect,
      correctAnswer: question.answer,
      message: isCorrect
        ? 'Correct! Well done.'
        : `Incorrect. Correct answer: ${question.answer}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/questions/topics
// @desc    Get all unique topics
// @access  Private
const getTopics = async (req, res) => {
  try {
    const topics = await Question.distinct('topic', { isActive: true });
    res.status(200).json({ success: true, topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- ADMIN ROUTES ----------

// @route   POST /api/questions
// @access  Admin
const createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/questions/:id
// @access  Admin
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    res.status(200).json({ success: true, question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/questions/:id
// @access  Admin
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    res.status(200).json({ success: true, message: 'Question deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getQuestions,
  checkAnswer,
  getTopics,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
