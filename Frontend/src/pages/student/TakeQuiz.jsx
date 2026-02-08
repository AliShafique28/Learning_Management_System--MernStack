import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Trophy } from 'lucide-react';
import { quizAPI } from '../../api/endpoints';
import { handleAPIError, showSuccess, showError } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';

const TakeQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (started && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [started, timeLeft]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getById(id);
      const quizData = response.data.data;
      setQuiz(quizData);
      setQuestions(quizData.questions || []);

      // Set time limit in seconds
      if (quizData.timeLimit) {
        setTimeLeft(quizData.timeLimit * 60);
      }
    } catch (error) {
      handleAPIError(error);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setStarted(true);
  };

  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleAutoSubmit = () => {
    showError('Time is up! Quiz submitted automatically.');
    handleSubmit();
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter((q) => answers[q._id] === undefined);
    if (unanswered.length > 0) {
      const confirmed = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`
      );
      if (!confirmed) return;
    }

    setSubmitting(true);

    try {
      // Format answers for submission
      const formattedAnswers = questions.map((q) => ({
        questionId: q._id,
        selectedOptionIndex: answers[q._id] !== undefined ? answers[q._id] : -1,
      }));

      const response = await quizAPI.submit(id, { answers: formattedAnswers });
      setResult(response.data.data);
      showSuccess(
        response.data.data.passed
          ? '🎉 Congratulations! You passed the quiz!'
          : 'Quiz submitted. Keep practicing!'
      );
    } catch (error) {
      handleAPIError(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!quiz) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Quiz not found</p>
      </div>
    );
  }

  // Show result page
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            {/* Result Icon */}
            <div className="mb-6">
              {result.passed ? (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-10 h-10 text-green-600" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
              )}
            </div>

            {/* Result Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {result.passed ? 'Congratulations! 🎉' : 'Keep Trying!'}
            </h1>
            <p className="text-gray-600 mb-8">
              {result.passed
                ? 'You passed the quiz successfully!'
                : 'You need more practice to pass this quiz.'}
            </p>

            {/* Score */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Your Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {result.obtainedMarks}/{result.totalMarks}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Percentage</p>
                <p className="text-3xl font-bold text-primary-600">{result.percentage}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Passing %</p>
                <p className="text-3xl font-bold text-gray-900">{result.passingPercentage}%</p>
              </div>
            </div>

            {/* Attempts */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Attempts used: <strong>{result.attemptsUsed}</strong> / {result.maxAttempts}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  const safeCourseId = typeof quiz.course === 'object'
                    ? quiz.course._id.toString()
                    : quiz.course.toString();
                  navigate(`/student/course/${safeCourseId}`);
                }}
                className="btn-secondary"
              >
                Back to Course
              </button>
              {!result.passed && result.attemptsUsed < result.maxAttempts && (
                <button
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                    setStarted(false);
                    if (quiz.timeLimit) {
                      setTimeLeft(quiz.timeLimit * 60);
                    }
                    fetchQuiz();
                  }}
                  className="btn-primary"
                >
                  Retry Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show intro page
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="card">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
            <p className="text-gray-600 mb-8">{quiz.description}</p>

            {/* Quiz Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Questions</p>
                    <p className="font-bold text-gray-900">{questions.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Limit</p>
                    <p className="font-bold text-gray-900">
                      {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Passing %</p>
                    <p className="font-bold text-gray-900">{quiz.passingPercentage}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Max Attempts</p>
                    <p className="font-bold text-gray-900">{quiz.maxAttempts}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Answer all questions to the best of your ability</li>
                {quiz.timeLimit && (
                  <li>
                    You have {quiz.timeLimit} minutes to complete the quiz
                  </li>
                )}
                <li>You need {quiz.passingPercentage}% to pass</li>
                <li>You can attempt this quiz up to {quiz.maxAttempts} times</li>
                <li>Once started, you cannot pause the quiz</li>
              </ul>
            </div>

            {/* Start Button */}
            <button onClick={handleStartQuiz} className="w-full btn-primary py-3 text-lg">
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz questions
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Timer */}
        {timeLeft !== null && (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Time Remaining</h2>
              <div
                className={`flex items-center gap-2 text-lg font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-900'
                  }`}
              >
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question._id} className="card">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {question.questionText}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${answers[question._id] === optionIndex
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question._id}`}
                          checked={answers[question._id] === optionIndex}
                          onChange={() => handleAnswerChange(question._id, optionIndex)}
                          className="w-5 h-5 text-primary-600"
                        />
                        <span className="flex-1 text-gray-900">{option.text}</span>
                      </label>
                    ))}
                  </div>

                  {/* Marks */}
                  <p className="text-sm text-gray-500 mt-3">{question.marks} marks</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Answered: {Object.keys(answers).length} / {questions.length}
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;
