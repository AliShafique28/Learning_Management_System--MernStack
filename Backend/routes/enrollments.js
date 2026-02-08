const express = require('express');
const router = express.Router();
const {
  requestEnrollment,
  getEnrollmentRequests,
  updateEnrollmentStatus,
  getMyEnrolledCourses,
  getEnrollmentDetails,
  updateProgress,
  rateCourse,
  removeEnrollment
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// @route   POST /api/enrollments/request
// @desc    Request enrollment in course (Student)
// @access  Private/Student
router.post('/request', protect, roleCheck('student'), requestEnrollment);

// @route   GET /api/enrollments/requests
// @desc    Get enrollment requests for instructor's courses
// @access  Private/Instructor
router.get('/requests', protect, roleCheck('instructor'), getEnrollmentRequests);

// @route   PUT /api/enrollments/:id/status
// @desc    Approve/Reject enrollment (Instructor)
// @access  Private/Instructor
router.put('/:id/status', protect, roleCheck('instructor'), updateEnrollmentStatus);

// @route   GET /api/enrollments/my-courses
// @desc    Get student's enrolled courses
// @access  Private/Student
router.get('/my-courses', protect, roleCheck('student'), getMyEnrolledCourses);

// @route   GET /api/enrollments/:enrollmentId
// @desc    Get enrollment details with progress
// @access  Private/Student
router.get('/:enrollmentId', protect, roleCheck('student'), getEnrollmentDetails);

// @route   PUT /api/enrollments/:enrollmentId/progress
// @desc    Update course progress (auto-calculate)
// @access  Private/Student
router.put('/:enrollmentId/progress', protect, roleCheck('student'), updateProgress);

// @route   PUT /api/enrollments/:enrollmentId/review
// @desc    Rate and review course
// @access  Private/Student
router.put('/:enrollmentId/review', protect, roleCheck('student'), rateCourse);

// @route   DELETE /api/enrollments/:id
// @desc    Remove student from course (Instructor)
// @access  Private/Instructor
router.delete('/:id', protect, roleCheck('instructor'), removeEnrollment);

module.exports = router;
