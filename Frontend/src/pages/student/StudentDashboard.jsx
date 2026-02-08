import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { enrollmentAPI, certificateAPI } from '../../api/endpoints';
import { handleAPIError } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatPercentage } from '../../utils/formatters';

const StudentDashboard = () => {
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    certificates: 0,
  });
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch enrolled courses
      const enrollmentsRes = await enrollmentAPI.getMyCourses();
      const enrollments = enrollmentsRes.data.data;

      // Calculate stats
      const completed = enrollments.filter((e) => e.progress === 100).length;
      const inProgress = enrollments.filter((e) => e.progress > 0 && e.progress < 100).length;

      // Fetch certificates
      const certificatesRes = await certificateAPI.getMyCertificates();
      const certificates = certificatesRes.data.count || 0;

      setStats({
        enrolledCourses: enrollments.length,
        completedCourses: completed,
        inProgressCourses: inProgress,
        certificates,
      });

      setEnrollments(enrollments);
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Student Dashboard</h1>
        <p className="text-gray-600">Track your learning progress and achievements.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Enrolled Courses */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Enrolled Courses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.enrolledCourses}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/student/browse-courses"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Browse more →
            </Link>
          </div>
        </div>

        {/* In Progress */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-gray-900">{stats.inProgressCourses}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-yellow-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            Keep learning!
          </div>
        </div>

        {/* Completed */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedCourses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <Award className="w-4 h-4 mr-1" />
            Great job!
          </div>
        </div>

        {/* Certificates */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Certificates</p>
              <p className="text-3xl font-bold text-gray-900">{stats.certificates}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/student/certificates"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all →
            </Link>
          </div>
        </div>
      </div>

      {/* Continue Learning Section */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">Continue Learning</h2>
          <Link
            to="/student/my-courses"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all →
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet</p>
            <Link to="/student/browse-courses" className="btn-primary">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.slice(0, 3).map((enrollment) => (
              <EnrollmentCard key={enrollment._id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/student/browse-courses"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors">
              <BookOpen className="w-6 h-6 text-primary-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Browse Courses</h3>
              <p className="text-sm text-gray-600">Find new courses</p>
            </div>
          </div>
        </Link>

        <Link
          to="/student/my-courses"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
              <Play className="w-6 h-6 text-green-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">My Courses</h3>
              <p className="text-sm text-gray-600">Continue learning</p>
            </div>
          </div>
        </Link>

        <Link
          to="/student/certificates"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
              <Award className="w-6 h-6 text-purple-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Certificates</h3>
              <p className="text-sm text-gray-600">View achievements</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

// Enrollment Card Component
const EnrollmentCard = ({ enrollment }) => {
  const course = enrollment.course;

  return (
    <Link
      to={`/student/course/${course._id}`}
      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-8 h-8 text-primary-600" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 mb-1 truncate">{course.title}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{course.description}</p>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${enrollment.progress}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {formatPercentage(enrollment.progress)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {enrollment.progress === 100 ? (
          <span className="badge badge-success">Completed</span>
        ) : (
          <span className="badge badge-warning">In Progress</span>
        )}
        <Play className="w-5 h-5 text-primary-600" />
      </div>
    </Link>
  );
};

export default StudentDashboard;
