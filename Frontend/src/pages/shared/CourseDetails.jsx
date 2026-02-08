import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Star,
  Award,
  CheckCircle,
  Play,
} from 'lucide-react';
import { courseAPI, moduleAPI, enrollmentAPI } from '../../api/endpoints';
import { handleAPIError, showSuccess } from '../../utils/errorHandler';
import useAuthStore from '../../store/authStore';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);

      // Fetch course
      const courseRes = await courseAPI.getById(id);
      setCourse(courseRes.data.data);

      // Fetch modules
      const modulesRes = await moduleAPI.getByCourse(id);
      setModules(modulesRes.data.data);

      // Check enrollment status
      if (isAuthenticated && user.role === 'student') {
        try {
          const enrollmentsRes = await enrollmentAPI.getMyCourses();
          const enrollment = enrollmentsRes.data.data.find(
            (e) => e.course._id === id
          );
          if (enrollment) {
            setIsEnrolled(true);
            setEnrollmentStatus(enrollment.status);
          }
        } catch (error) {
          console.error('Error checking enrollment:', error);
        }
      }
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      const result = await Swal.fire({
        title: 'Login Required',
        text: 'You need to login to enroll in this course',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Go to Login',
        cancelButtonText: 'Cancel',
      });

      if (result.isConfirmed) {
        navigate('/login');
      }
      return;
    }

    const result = await Swal.fire({
      title: 'Enroll in Course?',
      html: `Do you want to enroll in <strong>${course.title}</strong>?<br><small>Your request will be sent to the instructor for approval.</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, enroll me',
    });

    if (result.isConfirmed) {
      try {
        await enrollmentAPI.request({ courseId: id });
        showSuccess('Enrollment request sent! Waiting for instructor approval.');
        setIsEnrolled(true);
        setEnrollmentStatus('pending');
      } catch (error) {
        handleAPIError(error);
      }
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
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-gray-200 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-blue-100 mb-6">{course.description}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">
                    {course.averageRating?.toFixed(1) || 0}
                  </span>
                  <span className="text-blue-100">
                    ({course.totalRatings || 0} ratings)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{course.studentsEnrolled || 0} students enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration} hours</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-3">
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-lg font-medium">
                  {course.category}
                </span>
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-lg font-medium">
                  {course.level}
                </span>
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 text-gray-900">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Instructor</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {course.instructor?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{course.instructor?.name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {course.instructor?.role}
                      </p>
                    </div>
                  </div>
                </div>

                {isEnrolled ? (
                  <div>
                    {enrollmentStatus === 'approved' ? (
                      <Link
                        to={`/student/course/${id}`}
                        className="w-full btn-primary py-3 text-center block mb-3"
                      >
                        Go to Course
                      </Link>
                    ) : enrollmentStatus === 'pending' ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⏳ Enrollment Pending
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Waiting for instructor approval
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                        <p className="text-sm text-red-800 font-medium">
                          ❌ Enrollment Rejected
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    className="w-full btn-primary py-3 mb-3"
                  >
                    Enroll Now
                  </button>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Access on mobile and desktop</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            <div className="card">
              <h2 className="section-title">What You'll Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">
                    Master {course.category} fundamentals and best practices
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Build real-world projects</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Get hands-on experience</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Earn a certificate</p>
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="card">
              <h2 className="section-title">Course Content</h2>
              <p className="text-gray-600 mb-4">
                {modules.length} modules • {course.duration} total hours
              </p>

              {modules.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Course content coming soon...
                </p>
              ) : (
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <div
                      key={module._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {module.title}
                          </h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="card">
              <h2 className="section-title">Requirements</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Basic understanding of computers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Eagerness to learn</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>No prior experience required</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Course Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Level</p>
                  <p className="font-medium text-gray-900">{course.level}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Duration</p>
                  <p className="font-medium text-gray-900">{course.duration} hours</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Students</p>
                  <p className="font-medium text-gray-900">
                    {course.studentsEnrolled || 0} enrolled
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(course.updatedAt || course.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
