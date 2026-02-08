const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  watchedDuration: {
    type: Number, // in seconds
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  }
});

// One progress record per student per lesson
videoProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model('VideoProgress', videoProgressSchema);
