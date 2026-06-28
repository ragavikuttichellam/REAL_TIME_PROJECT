require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const sessionRoutes = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://your-frontend-domain.com'
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173'
      ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/sessions', sessionRoutes);

// ── AI Hint Proxy ───────────────────────────────────────────────
// ✅ Anthropic API key stays on server only — never exposed to browser
const { protect } = require('./middleware/auth');

app.post('/api/ai/hint', protect, async (req, res) => {
  try {
    const { question, feedback } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'question is required.' });
    }

    const prompt = feedback
      ? `Interview question: "${question.question}". The user answered ${feedback.isCorrect ? 'correctly' : 'incorrectly'}. Correct answer: "${question.answer}". Give a 2-sentence explanation of why this is correct and a key concept to remember. Be concise and encouraging.`
      : `Interview question: "${question.question}" (${question.type}, ${question.topic}, ${question.difficulty}). Give a 2-sentence coaching hint without revealing the answer. Focus on how to think about it.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,       // ✅ Key stays on server
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'AI service error.', detail: data });
    }

    const hint = data.content?.map(b => b.text || '').join('') || 'Think carefully and use process of elimination.';
    res.status(200).json({ success: true, hint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Health check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Interview Session API is running 🚀',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📌 Available routes:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/questions`);
  console.log(`   POST   /api/questions/check`);
  console.log(`   GET    /api/questions/topics`);
  console.log(`   POST   /api/sessions/start`);
  console.log(`   POST   /api/sessions/:id/submit`);
  console.log(`   GET    /api/sessions/history`);
  console.log(`   GET    /api/sessions/leaderboard`);
  console.log(`   GET    /api/sessions/:id`);
  console.log(`   POST   /api/ai/hint          ← NEW`);
});

module.exports = app;