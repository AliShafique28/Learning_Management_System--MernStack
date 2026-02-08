const express = require('express');
const router = express.Router();
const {
  createLesson,
  getLessonsByModule,
  getLessonById,
  updateLesson,
  deleteLesson
} = require('../controllers/lessonController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { uploadVideo, handleUploadError } = require('../middleware/upload');

// @route   POST /api/lessons
// @desc    Create lesson with video upload
// @access  Private/Instructor
router.post('/', protect, roleCheck('instructor'), uploadVideo, handleUploadError, createLesson);

// @route   GET /api/lessons/module/:moduleId
// @desc    Get lessons by module ID
// @access  Public
router.get('/module/:moduleId', getLessonsByModule);

// @route   GET /api/lessons/:id
// @desc    Get single lesson
// @access  Private
router.get('/:id', protect, getLessonById);

// @route   PUT /api/lessons/:id
// @desc    Update lesson (optional video re-upload)
// @access  Private/Instructor
router.put('/:id', protect, roleCheck('instructor'), uploadVideo, handleUploadError, updateLesson);

// @route   DELETE /api/lessons/:id
// @desc    Delete lesson
// @access  Private/Instructor
router.delete('/:id', protect, roleCheck('instructor'), deleteLesson);

module.exports = router;
