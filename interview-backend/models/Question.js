const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 6,
        message: 'Options must have between 2 and 6 items',
      },
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Technical', 'HR', 'MCQ'],
      default: 'MCQ',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for fast random fetch
questionSchema.index({ topic: 1, type: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);
