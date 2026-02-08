// src/pages/student/StudentQuizzes.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
// Top imports mein YE ADD KARO:
import { Search, HelpCircle, Clock, CheckCircle, AlertCircle, Play, ArrowLeft } from 'lucide-react';

// import { Search, HelpCircle, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { quizAPI } from '../../api/endpoints';
import { handleAPIError } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';

const StudentQuizzes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const courseId = searchParams.get('courseId');

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      
      let response;
      if (courseId) {
        // 🔥 YOUR ENDPOINT - Perfect match!
        response = await quizAPI.getByCourse(courseId);
        setQuizzes(response.data.data || []);
      } else {
        // All quizzes fallback (empty for now)
        setQuizzes([]);
      }
    } catch (error) {
      handleAPIError(error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {courseId ? 'Course Quizzes' : 'My Quizzes'}
            </h1>
            <p className="text-gray-600">
              {courseId ? 'Test your knowledge' : 'All available quizzes'}
            </p>
          </div>
        </div>

        {/* Quizzes Grid */}
        {quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Link
                key={quiz._id}
                to={`/student/quiz/${quiz._id}`}
                className="group card hover:shadow-xl transition-all hover:-translate-y-1 border hover:border-primary-300"
              >
                {/* Icon + Title */}
                <div className="flex items-start gap-4 mb-4 p-4 pt-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <HelpCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 truncate mb-1">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {quiz.course?.title || 'General Quiz'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-6 pb-6 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Passing Mark</span>
                    <span className="font-semibold text-green-600">{quiz.passingPercentage}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Questions</span>
                    <span className="font-semibold text-gray-900">{quiz.questions?.length || 0}</span>
                  </div>
                  
                  {quiz.timeLimit && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.timeLimit} minutes</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Max Attempts</span>
                    <span className="font-semibold text-gray-900">{quiz.maxAttempts || '∞'}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="border-t bg-gray-50 px-6 py-4">
                  <span className="btn-primary w-full flex items-center justify-center gap-2 text-sm font-semibold">
                    Start Quiz
                    <Play className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
            <HelpCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Quizzes Available</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Quizzes will appear here once your instructor creates them for this course.
            </p>
            <Link to={`/student/my-courses`} className="btn-secondary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to My Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuizzes;
