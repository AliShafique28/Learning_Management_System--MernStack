const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Create lesson with video upload
// @route   POST /api/lessons
// @access  Private/Instructor
const createLesson = async (req, res) => {
  try {
    const { title, description, module, course, videoDuration, captions, order, isFree } = req.body;

    // Check if video file uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file'
      });
    }

    // Check if module and course exist
    const moduleExists = await Module.findById(module).populate('course');
    if (!moduleExists) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if user is course instructor
    if (moduleExists.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add lessons to this course'
      });
    }

    // Get video URL (relative path)
    const videoUrl = `/uploads/videos/${req.file.filename}`;

    // Create lesson
    const lesson = await Lesson.create({
      title,
      description: description || '',
      module,
      course,
      videoUrl,
      videoDuration: parseInt(videoDuration),
      captions: captions || '',
      order,
      isFree: isFree || false
    });
    // ******************************************************************
    const courseId = lesson.course;
    const allEnrollments = await Enrollment.find({
      course: courseId,
      status: 'approved'
    });

    for (const enrollment of allEnrollments) {
      const totalLessons = await Lesson.countDocuments({ course: courseId });
      const realProgress = totalLessons > 0 ? Math.round((enrollment.completedLessons.length / totalLessons) * 100) : 0;

      enrollment.progress = realProgress;
      await enrollment.save();

    }
    // ******************************************************
    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
    });
  } catch (error) {
    console.error('Create Lesson Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get lessons by module ID
// @route   GET /api/lessons/module/:moduleId
// @access  Public
const getLessonsByModule = async (req, res) => {
  try {
    const lessons = await Lesson.find({ module: req.params.moduleId })
      .sort('order');

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error) {
    console.error('Get Lessons Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Private
const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('module', 'title')
      .populate('course', 'title');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Get Lesson Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private/Instructor
const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: 'module',
      populate: { path: 'course' }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is course instructor
    if (lesson.module.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lesson'
      });
    }

    const { title, description, videoDuration, captions, order, isFree } = req.body;

    if (title) lesson.title = title;
    if (description) lesson.description = description;
    if (videoDuration) lesson.videoDuration = parseInt(videoDuration);
    if (captions) lesson.captions = captions;
    if (order !== undefined) lesson.order = order;
    if (isFree !== undefined) lesson.isFree = isFree;

    // If new video uploaded
    if (req.file) {
      lesson.videoUrl = `/uploads/videos/${req.file.filename}`;
    }

    await lesson.save();
    // ******************************************************************
    const courseId = lesson.course;
    const allEnrollments = await Enrollment.find({
      course: courseId,
      status: 'approved'
    });

    for (const enrollment of allEnrollments) {
      const totalLessons = await Lesson.countDocuments({ course: courseId });
      const realProgress = totalLessons > 0 ? Math.round((enrollment.completedLessons.length / totalLessons) * 100) : 0;

      enrollment.progress = realProgress;
      await enrollment.save();
      
    }
    // ******************************************************
    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson
    });
  } catch (error) {
    console.error('Update Lesson Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private/Instructor
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: 'module',
      populate: { path: 'course' }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is course instructor
    if (lesson.module.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this lesson'
      });
    }

    await lesson.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Delete Lesson Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createLesson,
  getLessonsByModule,
  getLessonById,
  updateLesson,
  deleteLesson
};
