const Module = require('../models/Module');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

// @desc    Create module in a course
// @route   POST /api/modules
// @access  Private/Instructor
const createModule = async (req, res) => {
  try {
    const { title, description, course, order } = req.body;

    // Check if course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is course instructor
    if (courseExists.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add modules to this course'
      });
    }

    // Create module
    const module = await Module.create({
      title,
      description: description || '',
      course,
      order
    });

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: module
    });
  } catch (error) {
    console.error('Create Module Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get modules by course ID
// @route   GET /api/modules/course/:courseId
// @access  Public
const getModulesByCourse = async (req, res) => {
  try {
    const modules = await Module.find({ course: req.params.courseId })
      .sort('order');

    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    console.error('Get Modules Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update module
// @route   PUT /api/modules/:id
// @access  Private/Instructor
const updateModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if user is course instructor
    if (module.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this module'
      });
    }

    const { title, description, order } = req.body;

    if (title) module.title = title;
    if (description) module.description = description;
    if (order !== undefined) module.order = order;

    await module.save();

    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: module
    });
  } catch (error) {
    console.error('Update Module Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete module
// @route   DELETE /api/modules/:id
// @access  Private/Instructor
const deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if user is course instructor
    if (module.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this module'
      });
    }

    // Delete all lessons in this module
    await Lesson.deleteMany({ module: module._id });

    await module.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Module and all lessons deleted successfully'
    });
  } catch (error) {
    console.error('Delete Module Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createModule,
  getModulesByCourse,
  updateModule,
  deleteModule
};
