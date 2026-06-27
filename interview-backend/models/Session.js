const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: String,
      default: null, // null = skipped
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    isSkipped: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    answers: [answerSchema],
    totalQuestions: {
      type: Number,
      required: true,
    },
    answered: {
      type: Number,
      default: 0,
    },
    correct: {
      type: Number,
      default: 0,
    },
    skipped: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0, // Percentage (0–100)
    },
    timeTaken: {
      type: Number, // Seconds used
      default: 0,
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'timeout'],
      default: 'ongoing',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Auto-calculate score before save
sessionSchema.pre('save', function (next) {
  if (this.totalQuestions > 0) {
    this.score = Math.round((this.correct / this.totalQuestions) * 100);
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
