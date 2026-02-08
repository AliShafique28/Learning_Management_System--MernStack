const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');
const Forum = require('../models/Forum');

// @desc    Create new course (Instructor only)
// @route   POST /api/courses
// @access  Private/Instructor
const createCourse = async (req, res) => {
  try {
    const { title, description, category, level, duration, thumbnail } = req.body;

    // Create course
    const course = await Course.create({
      title,
      description,
      category,
      level: level || 'Beginner',
      duration: duration || 0,
      thumbnail: thumbnail || '',
      instructor: req.user._id
    });

    // Auto-create forum for this course
    await Forum.create({
      course: course._id
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Create Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getAllCourses = async (req, res) => {
  try {
    const { category, level, search } = req.query;

    // Build filter
    let filter = { isPublished: true };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(filter)
      .populate('instructor', 'name email bio')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Get Courses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email bio profilePicture');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get modules with lessons
    const modules = await Module.find({ course: course._id })
      .sort('order');

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await Lesson.find({ module: module._id }).sort('order');
        return {
          ...module.toObject(),
          lessons
        };
      })
    );

    // Get quizzes and assignments count
    const quizzesCount = await Quiz.countDocuments({ course: course._id });
    const assignmentsCount = await Assignment.countDocuments({ course: course._id });

    res.status(200).json({
      success: true,
      data: {
        ...course.toObject(),
        modules: modulesWithLessons,
        quizzesCount,
        assignmentsCount
      }
    });
  } catch (error) {
    console.error('Get Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get instructor's own courses
// @route   GET /api/courses/my-courses
// @access  Private/Instructor
const getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Get Instructor Courses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Instructor
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is course instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    const { title, description, category, level, duration, thumbnail, isPublished } = req.body;

    // Update fields
    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (level) course.level = level;
    if (duration !== undefined) course.duration = duration;
    if (thumbnail) course.thumbnail = thumbnail;
    if (isPublished !== undefined) course.isPublished = isPublished;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Update Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is course instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    // Cascade delete: modules, lessons, quizzes, assignments, enrollments, forum
    await Module.deleteMany({ course: course._id });
    await Lesson.deleteMany({ course: course._id });
    await Quiz.deleteMany({ course: course._id });
    await Assignment.deleteMany({ course: course._id });
    await Enrollment.deleteMany({ course: course._id });
    await Forum.deleteOne({ course: course._id });

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course and all related data deleted successfully'
    });
  } catch (error) {
    console.error('Delete Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  getInstructorCourses,
  updateCourse,
  deleteCourse
};
