const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  videoDuration: {
    type: Number, // in seconds
    required: true
  },
  captions: {
    type: String, // VTT or SRT file URL
    default: ''
  },
  order: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false // Preview lesson
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique order within a module
lessonSchema.index({ module: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessonSchema);
