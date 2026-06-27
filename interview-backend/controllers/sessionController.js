const Session = require('../models/Session');
const Question = require('../models/Question');
const User = require('../models/User');

// @route   POST /api/sessions/start
// @desc    Start a new session — returns question IDs
// @access  Private
const startSession = async (req, res) => {
  try {
    const { count = 15, topic, type, difficulty } = req.body;

    const filter = { isActive: true };
    if (topic) filter.topic = topic;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    const allQuestions = await Question.find(filter);
    if (allQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for the selected filters.',
      });
    }

    // Shuffle and pick
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, parseInt(count));

    const session = await Session.create({
      user: req.user._id,
      questions: selected.map((q) => q._id),
      totalQuestions: selected.length,
      status: 'ongoing',
    });

    // Return questions without answers
    const safeQuestions = selected.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      topic: q.topic,
      type: q.type,
      difficulty: q.difficulty,
    }));

    res.status(201).json({
      success: true,
      sessionId: session._id,
      questions: safeQuestions,
      totalQuestions: selected.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/sessions/:id/submit
// @desc    Submit all answers and save session result
// @access  Private
const submitSession = async (req, res) => {
  try {
    const { answers, timeTaken, status = 'completed' } = req.body;
    // answers: [{ questionId, selectedOption }]

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your session.' });
    }

    if (session.status !== 'ongoing') {
      return res.status(400).json({ success: false, message: 'Session already submitted.' });
    }

    // Fetch all questions to validate answers
    const questionIds = session.questions.map((id) => id.toString());
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = {};
    questions.forEach((q) => (questionMap[q._id.toString()] = q));

    let correct = 0;
    let skipped = 0;
    let answered = 0;

    const processedAnswers = (answers || []).map((ans) => {
      const question = questionMap[ans.questionId];
      const isSkipped = !ans.selectedOption;

      if (isSkipped) {
        skipped++;
        return { questionId: ans.questionId, selectedOption: null, isCorrect: false, isSkipped: true };
      }

      answered++;
      const isCorrect = question ? question.answer === ans.selectedOption : false;
      if (isCorrect) correct++;

      return {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption,
        isCorrect,
        isSkipped: false,
      };
    });

    // Count remaining as skipped
    const submittedIds = (answers || []).map((a) => a.questionId);
    questionIds.forEach((qId) => {
      if (!submittedIds.includes(qId)) {
        skipped++;
        processedAnswers.push({
          questionId: qId,
          selectedOption: null,
          isCorrect: false,
          isSkipped: true,
        });
      }
    });

    // Update session
    session.answers = processedAnswers;
    session.answered = answered;
    session.correct = correct;
    session.skipped = skipped;
    session.timeTaken = timeTaken || 0;
    session.status = status;
    session.completedAt = new Date();
    await session.save(); // score is auto-calculated in pre-save hook

    // Update user stats
    const user = await User.findById(req.user._id);
    user.totalSessions += 1;
    if (session.score > user.bestScore) user.bestScore = session.score;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Session submitted successfully.',
      result: {
        sessionId: session._id,
        totalQuestions: session.totalQuestions,
        answered,
        correct,
        wrong: Math.max(0, answered - correct),
        skipped,
        score: session.score,
        timeTaken: session.timeTaken,
        status: session.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/sessions/history
// @desc    Get user's past sessions
// @access  Private
const getSessionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await Session.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-answers'); // exclude detailed answers for list view

    const total = await Session.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      sessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/sessions/:id
// @desc    Get single session detail with answers
// @access  Private
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('questions', 'question options answer topic type difficulty')
      .populate('answers.questionId', 'question answer');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/sessions/leaderboard
// @desc    Top scores across all users
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const top = await Session.find({ status: 'completed' })
      .sort({ score: -1, timeTaken: 1 })
      .limit(10)
      .populate('user', 'name email');

    const leaderboard = top.map((s, i) => ({
      rank: i + 1,
      user: s.user?.name || 'Unknown',
      score: s.score,
      correct: s.correct,
      total: s.totalQuestions,
      timeTaken: s.timeTaken,
      date: s.completedAt,
    }));

    res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startSession,
  submitSession,
  getSessionHistory,
  getSessionById,
  getLeaderboard,
};
