const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Certificate = require('../models/Certificate');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const { v4: uuidv4 } = require('uuid');
const { generateCertificate } = require('../utils/pdfGenerator');

// @desc    Request enrollment (Student)
// @route   POST /api/enrollments/request
// @access  Private/Student
const requestEnrollment = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${existingEnrollment.status} enrollment for this course`
      });
    }

    // Create enrollment request
    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Enrollment request submitted. Waiting for instructor approval.',
      data: enrollment
    });
  } catch (error) {
    console.error('Request Enrollment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get enrollment requests for instructor's courses
// @route   GET /api/enrollments/requests
// @access  Private/Instructor
const getEnrollmentRequests = async (req, res) => {
  try {
    // Get instructor's courses
    const courses = await Course.find({ instructor: req.user._id }).select('_id');
    const courseIds = courses.map(c => c._id);

    // Get pending enrollments
    const requests = await Enrollment.find({
      course: { $in: courseIds },
      status: 'pending'
    })
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort('-enrolledAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get Enrollment Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve/Reject enrollment (Instructor)
// @route   PUT /api/enrollments/:id/status
// @access  Private/Instructor
const updateEnrollmentStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected'
      });
    }

    const enrollment = await Enrollment.findById(req.params.id).populate('course');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user is course instructor
    if (enrollment.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this enrollment'
      });
    }

    enrollment.status = status;
    await enrollment.save();

    // Update course students count if approved
    if (status === 'approved') {
      await Course.findByIdAndUpdate(enrollment.course._id, {
        $inc: { studentsEnrolled: 1 }
      });
    }

    res.status(200).json({
      success: true,
      message: `Enrollment ${status} successfully`,
      data: enrollment
    });
  } catch (error) {
    console.error('Update Enrollment Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get student's enrolled courses
// @route   GET /api/enrollments/my-courses
// @access  Private/Student
const getMyEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: 'approved'
    })
      .populate('course')
      .sort('-enrolledAt');

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    console.error('Get My Enrolled Courses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get enrollment details with progress
// @route   GET /api/enrollments/:enrollmentId
// @access  Private
const getEnrollmentDetails = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId)
      .populate('course')
      .populate('completedLessons')
      .populate('completedQuizzes.quiz');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this enrollment'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get Enrollment Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update course progress (auto-calculate)
// @route   PUT /api/enrollments/:enrollmentId/progress
// @access  Private/Student
const updateProgress = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Calculate progress
    const totalLessons = await Lesson.countDocuments({ course: enrollment.course });
    const totalQuizzes = await Quiz.countDocuments({ course: enrollment.course });

    const completedLessonsCount = enrollment.completedLessons.length;
    const passedQuizzesCount = enrollment.completedQuizzes.filter(q => q.passed).length;

    const totalItems = totalLessons + totalQuizzes;
    const completedItems = completedLessonsCount + passedQuizzesCount;

    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    enrollment.progress = Math.round(progress);
    await enrollment.save();

    // Check if course completed (100%)
    if (progress === 100 && !enrollment.completedAt) {
      enrollment.completedAt = Date.now();
      await enrollment.save();

      // Generate certificate
      const course = await Course.findById(enrollment.course);
      const student = await require('../models/User').findById(enrollment.student);

      const certificateId = uuidv4();
      const pdfUrl = await generateCertificate(
        student.name,
        course.title,
        certificateId,
        new Date()
      );

      await Certificate.create({
        student: enrollment.student,
        course: enrollment.course,
        certificateId,
        pdfUrl
      });

      return res.status(200).json({
        success: true,
        message: 'Congratulations! Course completed and certificate generated!',
        data: {
          progress: enrollment.progress,
          completedAt: enrollment.completedAt,
          certificateId
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progress updated',
      data: {
        progress: enrollment.progress
      }
    });
  } catch (error) {
    console.error('Update Progress Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Rate and review course (Student)
// @route   PUT /api/enrollments/:enrollmentId/review
// @access  Private/Student
const rateCourse = async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const enrollment = await Enrollment.findById(req.params.enrollmentId);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if already rated
    const previousRating = enrollment.rating;

    enrollment.rating = rating;
    enrollment.review = review || '';
    await enrollment.save();

    // Update course average rating
    const course = await Course.findById(enrollment.course);
    
    if (previousRating) {
      // Update existing rating
      const totalRatingPoints = course.averageRating * course.totalRatings;
      const newTotalPoints = totalRatingPoints - previousRating + rating;
      course.averageRating = newTotalPoints / course.totalRatings;
    } else {
      // New rating
      const totalRatingPoints = course.averageRating * course.totalRatings + rating;
      course.totalRatings += 1;
      course.averageRating = totalRatingPoints / course.totalRatings;
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Rating and review submitted successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Rate Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove student from course (Instructor)
// @route   DELETE /api/enrollments/:id
// @access  Private/Instructor
const removeEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('course');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user is course instructor
    if (enrollment.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this enrollment'
      });
    }

    await enrollment.deleteOne();

    // Update course students count
    await Course.findByIdAndUpdate(enrollment.course._id, {
      $inc: { studentsEnrolled: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Student removed from course successfully'
    });
  } catch (error) {
    console.error('Remove Enrollment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  requestEnrollment,
  getEnrollmentRequests,
  updateEnrollmentStatus,
  getMyEnrolledCourses,
  getEnrollmentDetails,
  updateProgress,
  rateCourse,
  removeEnrollment
};
