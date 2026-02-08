
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Play,
  Lock,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { courseAPI, moduleAPI, lessonAPI, enrollmentAPI } from '../../api/endpoints';
import { handleAPIError } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatDuration, formatPercentage } from '../../utils/formatters';

const CourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course
      const courseRes = await courseAPI.getById(id);
      setCourse(courseRes.data.data);

      // Fetch enrollment
      const enrollmentsRes = await enrollmentAPI.getMyCourses();
      const myEnrollment = enrollmentsRes.data.data.find(
        (e) => e.course._id === id
      );
      setEnrollment(myEnrollment);

      // Fetch modules with lessons
      const modulesRes = await moduleAPI.getByCourse(id);
      const modulesData = modulesRes.data.data;

      const modulesWithLessons = await Promise.all(
        modulesData.map(async (module) => {
          try {
            // ✅ FIX: Ensure module ID is string
            const moduleId = typeof module._id === 'object' ? module._id.toString() : module._id;

            const lessonsRes = await lessonAPI.getByModule(moduleId);

            return {
              ...module,
              lessons: lessonsRes.data.data || [],
            };
          } catch (error) {
            console.error('❌ Error fetching lessons for module:', module._id, error.response?.data || error.message);
            return { ...module, lessons: [] };
          }
        })
      );

      setModules(modulesWithLessons);

      // Expand first module by default
      if (modulesWithLessons.length > 0) {
        setExpandedModules({ [modulesWithLessons[0]._id]: true });
      }
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleLessonClick = (lesson) => {
    if (lesson.isFree || enrollment) {
      navigate(`/student/lesson/${lesson._id}`);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!course) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Course not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description}</p>

              <div className="flex items-center gap-4 text-sm">
                <span className="badge badge-primary">{course.category}</span>
                <span className="badge badge-secondary">{course.level}</span>
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  {course.duration} hours
                </span>
              </div>

              {/* Progress Bar (if enrolled) */}
              {enrollment && (
                <div className="mt-4 max-w-md">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Your Progress</span>
                    <span className="font-semibold text-primary-600">
                      {formatPercentage(enrollment.progress)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>

                </div>
              )}
            </div>

            {/* Forum Button */}
            {enrollment && (
              <Link
                to={`/forum/${course._id}`}
                className="btn-secondary flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Forum
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Course Content */}
        <div className="card mb-6">
          <h2 className="section-title">Course Content</h2>

          {modules.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No content available yet. Check back later!
            </p>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <div key={module._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module._id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </span>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {module.lessons?.length || 0} lessons
                      </span>
                      {expandedModules[module._id] ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </button>

                  {/* Lessons List */}
                  {expandedModules[module._id] && (
                    <div className="bg-white">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons.map((lesson, lessonIndex) => {
                          const isAccessible = lesson.isFree || enrollment;
                          const isCompleted = enrollment?.completedLessons?.includes(lesson._id);

                          return (
                            <button
                              key={lesson._id}
                              onClick={() => handleLessonClick(lesson)}
                              disabled={!isAccessible}
                              className={`w-full flex items-center justify-between p-4 border-t border-gray-200 hover:bg-gray-50 transition-colors ${!isAccessible ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : isAccessible ? (
                                  <Play className="w-5 h-5 text-primary-600" />
                                ) : (
                                  <Lock className="w-5 h-5 text-gray-400" />
                                )}
                                <div className="text-left">
                                  <p className="font-medium text-gray-900">
                                    {lessonIndex + 1}. {lesson.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDuration(lesson.videoDuration)}
                                    {lesson.isFree && (
                                      <span className="ml-2 badge badge-success text-xs">
                                        Free Preview
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-6">
                          No lessons in this module yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 🔥 QUIZZES & ASSIGNMENTS SECTION */}
        {enrollment && (
          <div className="card mb-6">
            <h2 className="section-title mb-6">Quizzes & Assignments</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Quizzes */}
              <Link
                to={`/student/quizzes?courseId=${course._id}`}
                className="group bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 hover:border-blue-300 rounded-xl p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <HelpCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quizzes</h3>
                <p className="text-gray-600 mb-4">Test your knowledge with course quizzes</p>
                <span className="btn-primary px-6 py-2 inline-flex items-center gap-2 group-hover:shadow-md">
                  View Quizzes
                  <Play className="w-4 h-4" />
                </span>
              </Link>

              {/* Assignments */}
              <Link
                to={`/student/assignments?courseId=${course._id}`}
                className="group bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-100 hover:border-green-300 rounded-xl p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Assignments</h3>
                <p className="text-gray-600 mb-4">Submit assignments for instructor review</p>
                <span className="btn-secondary px-6 py-2 inline-flex items-center gap-2 group-hover:shadow-md">
                  View Assignments
                  <Play className="w-4 h-4" />
                </span>
              </Link>

            </div>
          </div>
        )}

        {/* Enrollment CTA (if not enrolled) */}
        {!enrollment && (
          <div className="card text-center bg-primary-50 border-primary-200">
            <Lock className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Enroll to Access Full Course</h3>
            <p className="text-gray-600 mb-6">
              Get unlimited access to all course content, quizzes, and assignments
            </p>
            <Link to="/student/browse-courses" className="btn-primary">
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseView;
