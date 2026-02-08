import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Play, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { enrollmentAPI } from '../../api/endpoints';
import { handleAPIError } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatPercentage } from '../../utils/formatters';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, in-progress, completed
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await enrollmentAPI.getMyCourses();
      setEnrollments(response.data.data);
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (filter === 'in-progress') {
      return enrollment.progress > 0 && enrollment.progress < 100;
    } else if (filter === 'completed') {
      return enrollment.progress === 100;
    }
    return true;
  });

  const stats = {
    total: enrollments.length,
    inProgress: enrollments.filter((e) => e.progress > 0 && e.progress < 100).length,
    completed: enrollments.filter((e) => e.progress === 100).length,
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">My Courses</h1>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Courses</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Courses ({stats.total})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'in-progress'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Progress ({stats.inProgress})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredEnrollments.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all'
              ? 'No enrolled courses'
              : `No ${filter.replace('-', ' ')} courses`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all'
              ? 'Browse and enroll in courses to start learning'
              : 'Keep learning to see courses here'}
          </p>
          {filter === 'all' && (
            <Link to="/student/browse-courses" className="btn-primary">
              Browse Courses
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnrollments.map((enrollment) => (
            <CourseCard key={enrollment._id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
};

// Course Card Component
const CourseCard = ({ enrollment }) => {
  const course = enrollment.course;
  const progressColor =
    enrollment.progress === 100
      ? 'bg-green-600'
      : enrollment.progress > 0
      ? 'bg-primary-600'
      : 'bg-gray-300';

  return (
    <Link
      to={`/student/course/${course._id}`}
      className="card hover:shadow-lg transition-shadow flex items-center gap-6"
    >
      {/* Course Icon */}
      <div className="w-20 h-20 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-10 h-10 text-primary-600" />
      </div>

      {/* Course Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 mb-1 truncate">{course.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">
              {formatPercentage(enrollment.progress)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${progressColor} h-2 rounded-full transition-all`}
              style={{ width: `${enrollment.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className="badge badge-primary text-xs">{course.category}</span>
          <span className="badge badge-secondary text-xs">{course.level}</span>
          {enrollment.progress === 100 && (
            <span className="badge badge-success text-xs flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Play className="w-5 h-5" />
          <span className="font-medium">
            {enrollment.progress === 0 ? 'Start' : enrollment.progress === 100 ? 'Review' : 'Continue'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MyCourses;
