const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// // @desc    Create quiz
// // @route   POST /api/quizzes
// // @access  Private/Instructor
// const createQuiz = async (req, res) => {
//   try {
//     const { title, description, course, module, passingPercentage, timeLimit, maxAttempts } = req.body;

//     // Check if course exists
//     const courseExists = await Course.findById(course);
//     if (!courseExists) {
//       return res.status(404).json({
//         success: false,
//         message: 'Course not found'
//       });
//     }

//     // Check if user is course instructor
//     if (courseExists.instructor.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to create quiz for this course'
//       });
//     }

//     // Create quiz
//     const quiz = await Quiz.create({
//       title,
//       description: description || '',
//       course,
//       module: module || null,
//       passingPercentage: passingPercentage || 70,
//       timeLimit: timeLimit || 30,
//       maxAttempts: maxAttempts || 3
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Quiz created successfully',
//       data: quiz
//     });
//   } catch (error) {
//     console.error('Create Quiz Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get quizzes by course
// // @route   GET /api/quizzes/course/:courseId
// // @access  Private
// const getQuizzesByCourse = async (req, res) => {
//   try {
//     const quizzes = await Quiz.find({ course: req.params.courseId })
//       .populate('module', 'title')
//       .sort('createdAt');

//     res.status(200).json({
//       success: true,
//       count: quizzes.length,
//       data: quizzes
//     });
//   } catch (error) {
//     console.error('Get Quizzes Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// @desc    Create quiz
// @route   POST /api/quizzes
// @access  Private/Instructor
const createQuiz = async (req, res) => {
  try {
    const { title, description, course, module, passingPercentage, timeLimit, maxAttempts, questions } = req.body;

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
        message: 'Not authorized to create quiz for this course'
      });
    }

    // Create quiz
    const quiz = await Quiz.create({
      title,
      description: description || '',
      course,
      module: module || null,
      passingPercentage: passingPercentage || 70,
      timeLimit: timeLimit || 30,
      maxAttempts: maxAttempts || 3,
      isPublished: questions && questions.length > 0 ? true : false
    });

    // ✅ Create questions if provided
    let createdQuestions = [];
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionDocs = questions.map((q, index) => ({
        quiz: quiz._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks || 1,
        order: q.order || index + 1
      }));

      createdQuestions = await Question.insertMany(questionDocs);
    }

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: {
        ...quiz.toObject(),
        questionsCount: createdQuestions.length
      }
    });
  } catch (error) {
    console.error('Create Quiz Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get quizzes by course
// @route   GET /api/quizzes/course/:courseId
// @access  Private
const getQuizzesByCourse = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId })
      .populate('module', 'title')
      .sort('createdAt');

    // ✅ Add questions count to each quiz
    const quizzesWithCounts = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionsCount = await Question.countDocuments({ quiz: quiz._id });
        return {
          ...quiz.toObject(),
          questionsCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: quizzesWithCounts.length,
      data: quizzesWithCounts
    });
  } catch (error) {
    console.error('Get Quizzes Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Get single quiz with questions
// @route   GET /api/quizzes/:id
// @access  Private
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course', 'title')
      .populate('module', 'title');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Get questions
    const questions = await Question.find({ quiz: quiz._id }).sort('order');

    res.status(200).json({
      success: true,
      data: {
        ...quiz.toObject(),
        questions
      }
    });
  } catch (error) {
    console.error('Get Quiz Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Instructor
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user is course instructor
    if (quiz.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this quiz'
      });
    }

    const { title, description, passingPercentage, timeLimit, maxAttempts, isPublished } = req.body;

    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (passingPercentage !== undefined) quiz.passingPercentage = passingPercentage;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (maxAttempts !== undefined) quiz.maxAttempts = maxAttempts;
    if (isPublished !== undefined) quiz.isPublished = isPublished;

    quiz.updatedAt = Date.now();
    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Update Quiz Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Instructor
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user is course instructor
    if (quiz.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this quiz'
      });
    }

    // Delete all questions
    await Question.deleteMany({ quiz: quiz._id });

    await quiz.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quiz and all questions deleted successfully'
    });
  } catch (error) {
    console.error('Delete Quiz Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add question to quiz
// @route   POST /api/quizzes/:quizId/questions
// @access  Private/Instructor
const addQuestion = async (req, res) => {
  try {
    const { questionText, options, marks, order } = req.body;

    const quiz = await Quiz.findById(req.params.quizId).populate('course');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user is course instructor
    if (quiz.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add questions to this quiz'
      });
    }

    // Validate options (at least one correct answer)
    const hasCorrectAnswer = options.some(opt => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      return res.status(400).json({
        success: false,
        message: 'At least one option must be marked as correct'
      });
    }

    // Create question
    const question = await Question.create({
      quiz: quiz._id,
      questionText,
      options,
      marks: marks || 1,
      order
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: question
    });
  } catch (error) {
    console.error('Add Question Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update question
// @route   PUT /api/quizzes/questions/:questionId
// @access  Private/Instructor
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId).populate({
      path: 'quiz',
      populate: { path: 'course' }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user is course instructor
    if (question.quiz.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this question'
      });
    }

    const { questionText, options, marks, order } = req.body;

    if (questionText) question.questionText = questionText;
    if (options) {
      // Validate at least one correct answer
      const hasCorrectAnswer = options.some(opt => opt.isCorrect === true);
      if (!hasCorrectAnswer) {
        return res.status(400).json({
          success: false,
          message: 'At least one option must be marked as correct'
        });
      }
      question.options = options;
    }
    if (marks !== undefined) question.marks = marks;
    if (order !== undefined) question.order = order;

    await question.save();

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    console.error('Update Question Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete question
// @route   DELETE /api/quizzes/questions/:questionId
// @access  Private/Instructor
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId).populate({
      path: 'quiz',
      populate: { path: 'course' }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user is course instructor
    if (question.quiz.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question'
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete Question Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Submit quiz (Student) - Auto-grading
// @route   POST /api/quizzes/:quizId/submit
// @access  Private/Student
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // Array of { questionId, selectedOptionIndex }

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if student is enrolled
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course,
      status: 'approved'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to take the quiz'
      });
    }

    // Check max attempts
    const quizAttempt = enrollment.completedQuizzes.find(
      q => q.quiz.toString() === quiz._id.toString()
    );

    if (quizAttempt && quizAttempt.attempts >= quiz.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: `Maximum attempts (${quiz.maxAttempts}) reached for this quiz`
      });
    }

    // Get all questions
    const questions = await Question.find({ quiz: quiz._id });

    // Calculate score
    let totalMarks = 0;
    let obtainedMarks = 0;

    questions.forEach(question => {
      totalMarks += question.marks;

      const studentAnswer = answers.find(
        ans => ans.questionId === question._id.toString()
      );

      if (studentAnswer) {
        const selectedOption = question.options[studentAnswer.selectedOptionIndex];
        if (selectedOption && selectedOption.isCorrect) {
          obtainedMarks += question.marks;
        }
      }
    });

    const percentage = (obtainedMarks / totalMarks) * 100;
    const passed = percentage >= quiz.passingPercentage;

    // Update enrollment
    const existingQuizIndex = enrollment.completedQuizzes.findIndex(
      q => q.quiz.toString() === quiz._id.toString()
    );

    if (existingQuizIndex !== -1) {
      // Update existing attempt
      enrollment.completedQuizzes[existingQuizIndex].score = percentage;
      enrollment.completedQuizzes[existingQuizIndex].passed = passed;
      enrollment.completedQuizzes[existingQuizIndex].attempts += 1;
    } else {
      // First attempt
      enrollment.completedQuizzes.push({
        quiz: quiz._id,
        score: percentage,
        passed: passed,
        attempts: 1
      });
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: passed ? 'Quiz passed! Congratulations!' : 'Quiz failed. Try again!',
      data: {
        totalMarks,
        obtainedMarks,
        percentage: percentage.toFixed(2),
        passed,
        passingPercentage: quiz.passingPercentage,
        attemptsUsed: quizAttempt ? quizAttempt.attempts + 1 : 1,
        maxAttempts: quiz.maxAttempts
      }
    });
  } catch (error) {
    console.error('Submit Quiz Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createQuiz,
  getQuizzesByCourse,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitQuiz
};
