const VideoProgress = require('../models/VideoProgress');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');

const Course = require('../models/Course');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const { v4: uuidv4 } = require('uuid');
const generateCertificate = require('../utils/pdfGenerator').generateCertificate;

// @desc    Update video watch progress  
// @route   POST /api/progress/video
// @access  Private/Student
// const updateVideoProgress = async (req, res) => {
//   try {
//     const { lessonId, watchedDuration } = req.body;

//     const lesson = await Lesson.findById(lessonId);

//     if (!lesson) {
//       return res.status(404).json({
//         success: false,
//         message: 'Lesson not found'
//       });
//     }

//     // Check if student is enrolled
//     const enrollment = await Enrollment.findOne({
//       student: req.user._id,
//       course: lesson.course,
//       status: 'approved'
//     });

//     if (!enrollment) {
//       return res.status(403).json({
//         success: false,
//         message: 'You must be enrolled in this course'
//       });
//     }

//     // Check if video is completed (watched >= 90% of duration)
//     const completionThreshold = lesson.videoDuration * 0.9;
//     const isCompleted = watchedDuration >= completionThreshold;

//     // ✅ UPSERT: Update if exists, create if not
//     const progress = await VideoProgress.findOneAndUpdate(
//       {
//         student: req.user._id,
//         lesson: lessonId
//       },
//       {
//         watchedDuration,
//         isCompleted,
//         lastWatchedAt: new Date()
//       },
//       {
//         new: true,           // Return updated document
//         upsert: true,        // Create if doesn't exist
//         runValidators: true
//       }
//     );

//     // If completed for first time, add to enrollment's completed lessons
//     if (isCompleted && !enrollment.completedLessons.includes(lessonId)) {
//       enrollment.completedLessons.push(lessonId);
//       await enrollment.save();
//     }

//     res.status(200).json({
//       success: true,
//       message: isCompleted ? 'Lesson completed!' : 'Progress saved',
//       data: progress
//     });
//   } catch (error) {
//     console.error('Update Video Progress Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };
// 
//******************************************************************************************** */
// const updateVideoProgress = async (req, res) => {
//   try {
//     const { lessonId, watchedDuration } = req.body;

//     const lesson = await Lesson.findById(lessonId);
//     if (!lesson) {
//       return res.status(404).json({ success: false, message: 'Lesson not found' });
//     }

//     const enrollment = await Enrollment.findOne({
//       student: req.user._id,
//       course: lesson.course,
//       status: 'approved'
//     });
//     if (!enrollment) {
//       return res.status(403).json({ success: false, message: 'Must be enrolled' });
//     }

//     // VideoProgress upsert
//     const completionThreshold = lesson.videoDuration * 0.9;
//     const isCompleted = watchedDuration >= completionThreshold;

//     const progress = await VideoProgress.findOneAndUpdate(
//       { student: req.user._id, lesson: lessonId },
//       {
//         watchedDuration,
//         isCompleted,
//         lastWatchedAt: new Date()
//       },
//       { new: true, upsert: true, runValidators: true }
//     );

//     // First-time complete → Update enrollment
//     if (isCompleted && !enrollment.completedLessons.some(id => id.toString() === lessonId.toString())) {
//       enrollment.completedLessons = enrollment.completedLessons.filter(id => id.toString() !== lessonId.toString());//
//       enrollment.completedLessons.push(lessonId);

//       const totalLessons = await Lesson.countDocuments({ course: lesson.course });
//       // const uniqueCompleted = [...new Set(enrollment.completedLessons.map(id => id.toString()))];
//       const realProgress = totalLessons > 0 ? Math.round((enrollment.completedLessons.length / totalLessons) * 100) : 0;

//       enrollment.progress = realProgress;
//       await enrollment.save();

//       // console.log(`✅ Backend UPDATE: ${realProgress}% (${uniqueCompleted.length}/${totalLessons})`);

//       // 🔥 AUTO CERTIFICATE GENERATION ON 100%
//       if (realProgress >= 100 && !enrollment.completedAt) {
//         console.log('🎉 COURSE 100% COMPLETE - Generating Certificate!');

//         // Imports
//         const Course = require('../models/Course');
//         const User = require('../models/User');
//         const Certificate = require('../models/Certificate');
//         const { v4: uuidv4 } = require('uuid');
//         const generateCertificate = require('../utils/pdfGenerator').generateCertificate;

//         try {
//           const course = await Course.findById(lesson.course);
//           const student = await User.findById(enrollment.student);
//           const certificateId = uuidv4();
//           const pdfUrl = await generateCertificate(student.name, course.title, certificateId, new Date());

//           await Certificate.create({
//             student: enrollment.student,
//             course: enrollment.course,
//             certificateId,
//             pdfUrl
//           });

//           enrollment.completedAt = new Date();
//           await enrollment.save();

//           console.log('✅ Certificate Generated & Saved!');

//           res.status(200).json({
//             success: true,
//             message: 'Course completed! Certificate generated! 🎉',
//             data: progress,
//             courseProgress: realProgress,
//             certificateGenerated: true
//           });
//         } catch (certError) {
//           console.error('Certificate Generation Error:', certError);
//           res.status(200).json({
//             success: true,
//             message: 'Lesson completed! (Certificate error)',
//             data: progress,
//             courseProgress: realProgress
//           });
//         }
//       } else {
//         res.status(200).json({
//           success: true,
//           message: isCompleted ? 'Lesson completed!' : 'Progress saved',
//           data: progress,
//           courseProgress: realProgress
//         });
//       }
//     } else {
//       // Not first-time complete, just return normal response
//       const totalLessons = await Lesson.countDocuments({ course: lesson.course });
//       const uniqueCompleted = [...new Set(enrollment.completedLessons.map(id => id.toString()))];
//       const realProgress = totalLessons > 0 ? Math.round((uniqueCompleted.length / totalLessons) * 100) : 0;

//       res.status(200).json({
//         success: true,
//         message: isCompleted ? 'Lesson completed!' : 'Progress saved',
//         data: progress,
//         courseProgress: realProgress
//       });
//     }
//   } catch (error) {
//     console.error('Update Video Progress Error:', error);
//     res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };
//************************************************************************************** */
const updateVideoProgress = async (req, res) => {
  try {
    const { lessonId, watchedDuration } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const enrollmentExists = await Enrollment.exists({
      student: req.user._id,
      course: lesson.course,
      status: 'approved'
    });

    if (!enrollmentExists) {
      return res.status(403).json({ success: false, message: 'Must be enrolled' });
    }

    const completionThreshold = lesson.videoDuration * 0.9;
    const isCompleted = watchedDuration >= completionThreshold;

    const progress = await VideoProgress.findOneAndUpdate(
      { student: req.user._id, lesson: lessonId },
      {
        watchedDuration,
        isCompleted,
        lastWatchedAt: new Date()
      },
      { new: true, upsert: true, runValidators: true }
    );

    if (isCompleted) {
      await Enrollment.updateOne(
        {
          student: req.user._id,
          course: lesson.course,
          status: 'approved'
        },
        {
          $addToSet: { completedLessons: new mongoose.Types.ObjectId(lessonId) }
        }
      );
    }

    const updatedEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: lesson.course,
      status: 'approved'
    }).select('completedLessons');

    const uniqueCompletedCount = new Set(
      (updatedEnrollment?.completedLessons || []).map((id) => id.toString())
    ).size;

    const totalLessons = await Lesson.countDocuments({ course: lesson.course });
    const realProgress = totalLessons > 0
      ? Math.round((uniqueCompletedCount / totalLessons) * 100)
      : 0;

    await Enrollment.updateOne(
      {
        student: req.user._id,
        course: lesson.course,
        status: 'approved'
      },
      {
        $set: {
          progress: realProgress,
          ...(realProgress >= 100 ? { completedAt: new Date() } : {})
        }
      }
    );

    let certificateGenerated = false;

    if (realProgress >= 100) {
      try {
        const existingCertificate = await Certificate.findOne({
          student: req.user._id,
          course: lesson.course
        });

        if (!existingCertificate) {
          const [course, student] = await Promise.all([
            Course.findById(lesson.course),
            User.findById(req.user._id)
          ]);

          if (course && student) {
            const certificateId = uuidv4();
            const pdfUrl = await generateCertificate(
              student.name,
              course.title,
              certificateId,
              new Date()
            );

            const certDoc = await Certificate.findOneAndUpdate(
              { student: req.user._id, course: lesson.course },
              {
                $setOnInsert: {
                  certificateId,
                  pdfUrl,
                  issuedAt: new Date()
                }
              },
              { upsert: true, new: true, rawResult: true }
            );

            certificateGenerated = !!(
              certDoc &&
              certDoc.lastErrorObject &&
              certDoc.lastErrorObject.upserted
            );
          }
        }
      } catch (certError) {
        if (certError?.code !== 11000) {
          console.error('Certificate Generation Error:', certError);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message:
        realProgress >= 100 && certificateGenerated
          ? 'Course completed! Certificate generated! 🎉'
          : (isCompleted ? 'Lesson completed!' : 'Progress saved'),
      data: progress,
      courseProgress: realProgress,
      certificateGenerated
    });
  } catch (error) {
    console.error('Update Video Progress Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get video progress for a lesson
// @route   GET /api/progress/video/:lessonId
// @access  Private/Student
const getVideoProgress = async (req, res) => {
  try {
    const progress = await VideoProgress.findOne({
      student: req.user._id,
      lesson: req.params.lessonId
    });

    if (!progress) {
      return res.status(200).json({
        success: true,
        data: {
          watchedDuration: 0,
          isCompleted: false
        }
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get Video Progress Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all progress for a course
// @route   GET /api/progress/course/:courseId
// @access  Private/Student
const getCourseProgress = async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId });
    const lessonIds = lessons.map(l => l._id);

    const progressRecords = await VideoProgress.find({
      student: req.user._id,
      lesson: { $in: lessonIds }
    });

    res.status(200).json({
      success: true,
      data: progressRecords
    });
  } catch (error) {
    console.error('Get Course Progress Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  updateVideoProgress,
  getVideoProgress,
  getCourseProgress
};
