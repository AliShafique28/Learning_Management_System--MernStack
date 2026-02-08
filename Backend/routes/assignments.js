const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignmentsByCourse,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
  getMySubmissions
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { uploadAssignment, handleUploadError } = require('../middleware/upload');

// Assignment routes
// @route   POST /api/assignments
// @desc    Create assignment
// @access  Private/Instructor
router.post('/', protect, roleCheck('instructor'), createAssignment);

// @route   GET /api/assignments/course/:courseId
// @desc    Get assignments by course
// @access  Private
router.get('/course/:courseId', protect, getAssignmentsByCourse);

// @route   GET /api/assignments/my-submissions
// @desc    Get student's own submissions
// @access  Private/Student
router.get('/my-submissions', protect, roleCheck('student'), getMySubmissions);

// @route   GET /api/assignments/:id
// @desc    Get single assignment
// @access  Private
router.get('/:id', protect, getAssignmentById);

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private/Instructor
router.put('/:id', protect, roleCheck('instructor'), updateAssignment);

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private/Instructor
router.delete('/:id', protect, roleCheck('instructor'), deleteAssignment);

// Submission routes
// @route   POST /api/assignments/:id/submit
// @desc    Submit assignment (Student)
// @access  Private/Student
// router.post('/:id/submit', protect, roleCheck('student'), uploadAssignment, handleUploadError, submitAssignment);
router.post('/:id/submit', 
  uploadAssignment,           // 1️⃣ File upload FIRST
  handleUploadError,         // 2️⃣ Multer errors
  protect,                  // 3️⃣ Auth
  roleCheck('student'),     // 4️⃣ Role
  submitAssignment          // 5️⃣ Logic
);

// @route   GET /api/assignments/:id/submissions
// @desc    Get all submissions for assignment (Instructor)
// @access  Private/Instructor
router.get('/:id/submissions', protect, roleCheck('instructor'), getSubmissions);

// @route   PUT /api/assignments/submissions/:submissionId/grade
// @desc    Grade submission (Instructor)
// @access  Private/Instructor
router.put('/submissions/:submissionId/grade', protect, roleCheck('instructor'), gradeSubmission);

module.exports = router;
