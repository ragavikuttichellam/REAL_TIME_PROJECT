const express = require('express');
const router = express.Router();
const {
  startSession,
  submitSession,
  getSessionHistory,
  getSessionById,
  getLeaderboard,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

router.post('/start', protect, startSession);
router.post('/:id/submit', protect, submitSession);
router.get('/history', protect, getSessionHistory);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/:id', protect, getSessionById);

module.exports = router;
