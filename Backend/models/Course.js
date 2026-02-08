const mongoose = require('mongoose');

const Certificate = require('./Certificate');
const Enrollment = require('./Enrollment'); 
const VideoProgress = require('./VideoProgress');
const Lesson = require('./Lesson');
const Assignment = require('./Assignment');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Other']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: Number, // in hours
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  studentsEnrolled: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
courseSchema.pre('save', function() {
  this.updatedAt = Date.now();
});
// models/Course.js - add this:
courseSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const course = this;
  
  console.log(`🧹 Auto-cleaning course: ${course._id}`);
  
  // 1. Delete ALL certificates
  await Certificate.deleteMany({ course: course._id });
  console.log('✅ Certificates deleted');
  
  // 2. Delete ALL enrollments  
  await Enrollment.deleteMany({ course: course._id });
  console.log('✅ Enrollments deleted');

  await Assignment.deleteMany({ course: course._id });
  console.log('✅ Enrollments deleted');
  
  // 3. Delete related VideoProgress
  await VideoProgress.deleteMany({ 
    lesson: { $in: await Lesson.distinct('_id', { course: course._id }) }
  });
  console.log('✅ VideoProgress deleted');
});

module.exports = mongoose.model('Course', courseSchema);

