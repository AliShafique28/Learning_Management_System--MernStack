import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Edit,
  Trash2,
  Settings,
  Search,
  Filter,
  PlusCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { courseAPI } from '../../api/endpoints';
import { handleAPIError, showSuccess } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, published, draft

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterStatus]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getMyCourses();
      setCourses(response.data.data);
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Filter by status
    if (filterStatus === 'published') {
      filtered = filtered.filter((c) => c.isPublished);
    } else if (filterStatus === 'draft') {
      filtered = filtered.filter((c) => !c.isPublished);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  const handleTogglePublish = async (courseId, currentStatus) => {
    const result = await Swal.fire({
      title: currentStatus ? 'Unpublish Course?' : 'Publish Course?',
      text: currentStatus
        ? 'Students will no longer be able to see this course'
        : 'Students will be able to enroll in this course',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: currentStatus ? 'Yes, unpublish' : 'Yes, publish',
    });

    if (result.isConfirmed) {
      try {
        await courseAPI.update(courseId, { isPublished: !currentStatus });
        showSuccess(
          currentStatus ? 'Course unpublished successfully' : 'Course published successfully'
        );
        fetchCourses();
      } catch (error) {
        handleAPIError(error);
      }
    }
  };

  const handleDelete = async (courseId, courseName) => {
    const result = await Swal.fire({
      title: 'Delete Course?',
      html: `Are you sure you want to delete <strong>${courseName}</strong>?<br><small class="text-red-600">This action cannot be undone.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        await courseAPI.delete(courseId);
        showSuccess('Course deleted successfully');
        fetchCourses();
      } catch (error) {
        handleAPIError(error);
      }
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">My Courses</h1>
          <p className="text-gray-600">Manage and organize your courses</p>
        </div>
        <Link to="/instructor/create-course" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          Create Course
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({courses.length})
            </button>
            <button
              onClick={() => setFilterStatus('published')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'published'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published ({courses.filter((c) => c.isPublished).length})
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'draft'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Drafts ({courses.filter((c) => !c.isPublished).length})
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No courses found' : 'No courses yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? 'Try adjusting your search or filters'
              : 'Create your first course to get started'}
          </p>
          {!searchTerm && (
            <Link to="/instructor/create-course" className="btn-primary">
              Create Your First Course
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onTogglePublish={handleTogglePublish}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Course Card Component
const CourseCard = ({ course, onTogglePublish, onDelete }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Course Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{course.studentsEnrolled || 0} students</span>
        </div>
        <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
          {course.isPublished ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Additional Info */}
      <div className="mb-4 space-y-1 text-xs text-gray-500">
        <p>Category: {course.category}</p>
        <p>Level: {course.level}</p>
        <p>Created: {formatDate(course.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
        <Link
          to={`/instructor/manage-course/${course._id}`}
          className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Manage
        </Link>
        <Link
          to={`/instructor/edit-course/${course._id}`}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </Link>
        <button
          onClick={() => onTogglePublish(course._id, course.isPublished)}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          title={course.isPublished ? 'Unpublish' : 'Publish'}
        >
          {course.isPublished ? (
            <EyeOff className="w-4 h-4 text-yellow-600" />
          ) : (
            <Eye className="w-4 h-4 text-green-600" />
          )}
        </button>
        <button
          onClick={() => onDelete(course._id, course.title)}
          className="p-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
  );
};

export default MyCourses;
