const express = require('express');
const router = express.Router();
const {
  updateVideoProgress,
  getVideoProgress,
  getCourseProgress
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// @route   POST /api/progress/video
// @desc    Update video watch progress
// @access  Private/Student
router.post('/video', protect, roleCheck('student'), updateVideoProgress);

// @route   GET /api/progress/video/:lessonId
// @desc    Get video progress for a lesson
// @access  Private/Student
router.get('/video/:lessonId', protect, roleCheck('student'), getVideoProgress);

// @route   GET /api/progress/course/:courseId
// @desc    Get all progress for a course
// @access  Private/Student
router.get('/course/:courseId', protect, roleCheck('student'), getCourseProgress);

module.exports = router;
