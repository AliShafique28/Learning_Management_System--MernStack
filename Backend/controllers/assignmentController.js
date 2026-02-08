const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Private/Instructor
const createAssignment = async (req, res) => {
  try {
    const { title, description, course, module, totalMarks, dueDate, allowLateSubmission } = req.body;

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
        message: 'Not authorized to create assignment for this course'
      });
    }

    // Create assignment
    const assignment = await Assignment.create({
      title,
      description,
      course,
      module: module || null,
      totalMarks: totalMarks || 100,
      dueDate,
      allowLateSubmission: allowLateSubmission || false
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Create Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get assignments by course
// @route   GET /api/assignments/course/:courseId
// @access  Private
const getAssignmentsByCourse = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('module', 'title')
      .sort('dueDate');

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Get Assignments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title')
      .populate('module', 'title');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Get Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Instructor
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is course instructor
    if (assignment.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment'
      });
    }

    const { title, description, totalMarks, dueDate, allowLateSubmission } = req.body;

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (totalMarks !== undefined) assignment.totalMarks = totalMarks;
    if (dueDate) assignment.dueDate = dueDate;
    if (allowLateSubmission !== undefined) assignment.allowLateSubmission = allowLateSubmission;

    assignment.updatedAt = Date.now();
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Update Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Instructor
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is course instructor
    if (assignment.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment'
      });
    }

    // Delete all submissions
    await Submission.deleteMany({ assignment: assignment._id });

    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Assignment and all submissions deleted successfully'
    });
  } catch (error) {
    console.error('Delete Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Submit assignment (Student)
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
const submitAssignment = async (req, res) => {
  try {

    // Check if file uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a DOCX file'
      });
    }

    // 🔥 DOCX ONLY validation
    if (!req.file.mimetype.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      return res.status(400).json({
        success: false,
        message: 'Only DOCX files are allowed'
      });
    }

    const { comments } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if student is enrolled
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course,
      status: 'approved'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to submit assignments'
      });
    }

    // Check due date
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (now > dueDate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Assignment submission deadline has passed'
      });
    }

    const fileUrl = `/uploads/assignments/${req.file.filename}`;

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id
    });

    if (existingSubmission) {
      // Update submission (resubmit)
      existingSubmission.fileUrl = fileUrl;
      existingSubmission.fileName = req.file.originalname;
      existingSubmission.comments = comments || '';
      existingSubmission.status = 'submitted';
      existingSubmission.submittedAt = Date.now();
      existingSubmission.marksObtained = null;
      existingSubmission.feedback = '';
      existingSubmission.gradedAt = null;

      await existingSubmission.save();

      return res.status(200).json({
        success: true,
        message: 'Assignment resubmitted successfully',
        data: existingSubmission
      });
    }

    // Create new submission
    const submission = await Submission.create({
      assignment: assignment._id,
      student: req.user._id,
      fileUrl,
      fileName: req.file.originalname,
      comments: comments || ''
    });

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('Submit Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get submissions for assignment (Instructor)
// @route   GET /api/assignments/:id/submissions
// @access  Private/Instructor
const getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is course instructor
    if (assignment.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view submissions'
      });
    }

    const submissions = await Submission.find({ assignment: assignment._id })
      .populate('student', 'name email')
      .sort('-submittedAt');

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Get Submissions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Grade submission (Instructor)
// @route   PUT /api/assignments/submissions/:submissionId/grade
// @access  Private/Instructor
const gradeSubmission = async (req, res) => {
  try {
    const { marksObtained, feedback } = req.body;

    const submission = await Submission.findById(req.params.submissionId)
      .populate({
        path: 'assignment',
        populate: { path: 'course' }
      });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user is course instructor
    if (submission.assignment.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this submission'
      });
    }

    // Validate marks
    if (marksObtained < 0 || marksObtained > submission.assignment.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${submission.assignment.totalMarks}`
      });
    }

    submission.marksObtained = marksObtained;
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedAt = Date.now();

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: submission
    });
  } catch (error) {
    console.error('Grade Submission Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get student's own submissions
// @route   GET /api/assignments/my-submissions
// @access  Private/Student
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate('assignment', 'title dueDate totalMarks')
      .sort('-submittedAt');

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Get My Submissions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createAssignment,
  getAssignmentsByCourse,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
  getMySubmissions
};
