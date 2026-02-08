const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuizzesByCourse,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitQuiz
} = require('../controllers/quizController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Quiz routes
// @route   POST /api/quizzes
// @desc    Create quiz
// @access  Private/Instructor
router.post('/', protect, roleCheck('instructor'), createQuiz);

// @route   GET /api/quizzes/course/:courseId
// @desc    Get quizzes by course
// @access  Private
router.get('/course/:courseId', protect, getQuizzesByCourse);

// @route   GET /api/quizzes/:id
// @desc    Get single quiz with questions
// @access  Private
router.get('/:id', protect, getQuizById);

// @route   PUT /api/quizzes/:id
// @desc    Update quiz
// @access  Private/Instructor
router.put('/:id', protect, roleCheck('instructor'), updateQuiz);

// @route   DELETE /api/quizzes/:id
// @desc    Delete quiz
// @access  Private/Instructor
router.delete('/:id', protect, roleCheck('instructor'), deleteQuiz);

// Question routes
// @route   POST /api/quizzes/:quizId/questions
// @desc    Add question to quiz
// @access  Private/Instructor
router.post('/:quizId/questions', protect, roleCheck('instructor'), addQuestion);

// @route   PUT /api/quizzes/questions/:questionId
// @desc    Update question
// @access  Private/Instructor
router.put('/questions/:questionId', protect, roleCheck('instructor'), updateQuestion);

// @route   DELETE /api/quizzes/questions/:questionId
// @desc    Delete question
// @access  Private/Instructor
router.delete('/questions/:questionId', protect, roleCheck('instructor'), deleteQuestion);

// Quiz submission route
// @route   POST /api/quizzes/:quizId/submit
// @desc    Submit quiz (Student)
// @access  Private/Student
router.post('/:quizId/submit', protect, roleCheck('student'), submitQuiz);

module.exports = router;
