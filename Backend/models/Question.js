const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required']
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  marks: {
    type: Number,
    required: true,
    default: 1
  },
  order: {
    type: Number,
    required: true
  }
});

// Ensure at least one correct answer
questionSchema.pre('save', function() {
  const hasCorrectAnswer = this.options.some(opt => opt.isCorrect);
  if (!hasCorrectAnswer) {
    throw new Error('At least one option must be marked as correct');
  }
});

module.exports = mongoose.model('Question', questionSchema);
