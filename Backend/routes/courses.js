const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  getInstructorCourses,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// @route   POST /api/courses
// @desc    Create new course
// @access  Private/Instructor
router.post('/', protect, roleCheck('instructor'), createCourse);

// @route   GET /api/courses
// @desc    Get all published courses (with filters)
// @access  Public
router.get('/', getAllCourses);

// @route   GET /api/courses/my-courses
// @desc    Get instructor's own courses
// @access  Private/Instructor
router.get('/my-courses', protect, roleCheck('instructor'), getInstructorCourses);

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
router.get('/:id', getCourseById);

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private/Instructor
router.put('/:id', protect, roleCheck('instructor'), updateCourse);

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private/Instructor
router.delete('/:id', protect, roleCheck('instructor'), deleteCourse);

module.exports = router;
