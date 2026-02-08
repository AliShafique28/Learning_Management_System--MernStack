import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { courseAPI, enrollmentAPI, assignmentAPI } from '../../api/endpoints';
import { handleAPIError } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';

const InstructorDashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    pendingRequests: 0,
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch instructor's courses
      const coursesRes = await courseAPI.getMyCourses();
      const courses = coursesRes.data.data;

      // Calculate stats
      const published = courses.filter((c) => c.isPublished).length;
      const totalStudents = courses.reduce((sum, c) => sum + (c.studentsEnrolled || 0), 0);

      // Fetch enrollment requests
      const enrollmentsRes = await enrollmentAPI.getRequests();
      const pendingRequests = enrollmentsRes.data.data.filter(
        (e) => e.status === 'pending'
      ).length;

      setStats({
        totalCourses: courses.length,
        publishedCourses: published,
        totalStudents,
        pendingRequests,
      });

      // Get recent courses (latest 3)
      setRecentCourses(courses.slice(0, 3));

      // Fetch pending assignment submissions (if needed)
      // You can implement this later
      setPendingSubmissions([]);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Instructor Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your teaching overview.</p>
        </div>
        <Link to="/instructor/create-course" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          Create New Course
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Courses */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            {stats.publishedCourses} Published
          </div>
        </div>

        {/* Total Students */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            Active enrollments
          </div>
        </div>

        {/* Pending Requests */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/instructor/manage-course"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Review requests →
            </Link>
          </div>
        </div>

        {/* Submissions to Grade */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">To Grade</p>
              <p className="text-3xl font-bold text-gray-900">{pendingSubmissions.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/instructor/grading"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View submissions →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">Recent Courses</h2>
          <Link
            to="/instructor/my-courses"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all →
          </Link>
        </div>

        {recentCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No courses created yet</p>
            <Link to="/instructor/create-course" className="btn-primary">
              Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/instructor/create-course"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors">
              <PlusCircle className="w-6 h-6 text-primary-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Create Course</h3>
              <p className="text-sm text-gray-600">Start a new course</p>
            </div>
          </div>
        </Link>

        <Link
          to="/instructor/my-courses"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
              <BookOpen className="w-6 h-6 text-green-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">My Courses</h3>
              <p className="text-sm text-gray-600">Manage your courses</p>
            </div>
          </div>
        </Link>

        <Link
          to="/instructor/grading"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-600 transition-colors">
              <FileText className="w-6 h-6 text-yellow-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Grade Work</h3>
              <p className="text-sm text-gray-600">Review submissions</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

// Course Card Component
const CourseCard = ({ course }) => {
  return (
    <Link
      to={`/instructor/manage-course/${course._id}`}
      className="card hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span>{course.studentsEnrolled || 0}</span>
          </div>
          <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
            {course.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        Created {formatDate(course.createdAt)}
      </div>
    </Link>
  );
};

export default InstructorDashboard;
