const express = require('express');
const router = express.Router();
const {
  createModule,
  getModulesByCourse,
  updateModule,
  deleteModule
} = require('../controllers/moduleController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// @route   POST /api/modules
// @desc    Create module
// @access  Private/Instructor
router.post('/', protect, roleCheck('instructor'), createModule);

// @route   GET /api/modules/course/:courseId
// @desc    Get modules by course ID
// @access  Public
router.get('/course/:courseId', getModulesByCourse);

// @route   PUT /api/modules/:id
// @desc    Update module
// @access  Private/Instructor
router.put('/:id', protect, roleCheck('instructor'), updateModule);

// @route   DELETE /api/modules/:id
// @desc    Delete module
// @access  Private/Instructor
router.delete('/:id', protect, roleCheck('instructor'), deleteModule);

module.exports = router;
