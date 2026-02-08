import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  PlusCircle,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Video,
} from 'lucide-react';
import { courseAPI, moduleAPI, lessonAPI, enrollmentAPI, quizAPI, assignmentAPI } from '../../api/endpoints';
import { handleAPIError, showSuccess, showError } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatDate, formatDuration } from '../../utils/formatters';
import Swal from 'sweetalert2';

const ManageCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [quizzes, setQuizzes] = useState([]); // ✅ Add
  const [assignments, setAssignments] = useState([]); // ✅ Add
  const [enrollmentRequests, setEnrollmentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('content'); // content, enrollments
  const [expandedModules, setExpandedModules] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const courseRes = await courseAPI.getById(id);
      setCourse(courseRes.data.data);

      // Fetch modules with lessons
      const modulesRes = await moduleAPI.getByCourse(id);
      const modulesData = modulesRes.data.data;

      // Fetch lessons for each module
      const modulesWithLessons = await Promise.all(
        modulesData.map(async (module) => {
          try {
            const lessonsRes = await lessonAPI.getByModule(module._id);
            return {
              ...module,
              lessons: lessonsRes.data.data || [],
            };
          } catch (error) {
            return { ...module, lessons: [] };
          }
        })
      );

      setModules(modulesWithLessons);

      // ✅ Fetch Quizzes
      try {
        const quizzesRes = await quizAPI.getByCourse(id);
        setQuizzes(quizzesRes.data.data || []);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setQuizzes([]);
      }

      // ✅ Fetch Assignments
      try {
        const assignmentsRes = await assignmentAPI.getByCourse(id);
        setAssignments(assignmentsRes.data.data || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setAssignments([]);
      }

      // Fetch enrollment requests
      const enrollmentsRes = await enrollmentAPI.getRequests();
      const courseEnrollments = enrollmentsRes.data.data.filter(
        (e) => e.course._id === id && e.status === 'pending'
      );
      setEnrollmentRequests(courseEnrollments);
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

  const handleDeleteModule = async (moduleId, moduleName) => {
    const result = await Swal.fire({
      title: 'Delete Module?',
      html: `Are you sure you want to delete <strong>${moduleName}</strong>?<br><small class="text-red-600">All lessons in this module will be deleted.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        await moduleAPI.delete(moduleId);
        showSuccess('Module deleted successfully');
        fetchCourseData();
      } catch (error) {
        handleAPIError(error);
      }
    }
  };

  // const handleDeleteLesson = async (lessonId, lessonName) => {
  //   const result = await Swal.fire({
  //     title: 'Delete Lesson?',
  //     text: `Are you sure you want to delete "${lessonName}"?`,
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonColor: '#ef4444',
  //     cancelButtonColor: '#6b7280',
  //     confirmButtonText: 'Yes, delete it',
  //   });

  //   if (result.isConfirmed) {
  //     try {
  //       await lessonAPI.delete(lessonId);
  //       showSuccess('Lesson deleted successfully');
  //       fetchCourseData();
  //     } catch (error) {
  //       handleAPIError(error);
  //     }
  //   }
  // };

  const handleEnrollmentAction = async (enrollmentId, action) => {
    try {
      await enrollmentAPI.updateStatus(enrollmentId, { status: action });
      showSuccess(`Enrollment ${action} successfully`);
      fetchCourseData();
    } catch (error) {
      handleAPIError(error);
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/instructor/my-courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to My Courses
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{course.title}</h1>
            <p className="text-gray-600">{course.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
              <span className="text-sm text-gray-600">
                <Users className="w-4 h-4 inline mr-1" />
                {course.studentsEnrolled || 0} students
              </span>
              <span className="text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                {course.duration} hours
              </span>
            </div>
          </div>
          <Link
            to={`/instructor/edit-course/${id}`}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Course
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-3 font-medium transition-colors ${activeTab === 'content'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <BookOpen className="w-5 h-5 inline mr-2" />
            Course Content
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`px-4 py-3 font-medium transition-colors relative ${activeTab === 'enrollments'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Enrollment Requests
            {enrollmentRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                {enrollmentRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'content' ? (
        <ContentTab
          modules={modules}
          quizzes={quizzes}
          assignments={assignments}
          courseId={id}
          expandedModules={expandedModules}
          toggleModule={toggleModule}
          onDeleteModule={handleDeleteModule}
          // onDeleteLesson={handleDeleteLesson}
          onRefresh={fetchCourseData}
        />
      ) : (
        <EnrollmentsTab
          enrollments={enrollmentRequests}
          onAction={handleEnrollmentAction}
        />
      )}
    </div>
  );
};

// Content Tab Component
const ContentTab = ({
  modules,
  quizzes,
  assignments,
  courseId,
  expandedModules,
  toggleModule,
  onDeleteModule,
  // onDeleteLesson,
  onRefresh,
}) => {
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);


  const handleAddModule = () => {
    setShowModuleForm(true);
  };

  const handleAddLesson = (moduleId) => {
    setSelectedModule(moduleId);
    setShowLessonForm(true);
  };

  // ✅ Quiz always needs module
  const handleAddQuiz = (moduleId) => {
    setSelectedModule(moduleId);
    setShowQuizForm(true);
  };

  // ✅ Assignment always needs module
  const handleAddAssignment = (moduleId) => {
    setSelectedModule(moduleId);
    setShowAssignmentForm(true);
  };

  const handleDeleteQuiz = async (quizId, quizTitle) => {
    const result = await Swal.fire({
      title: 'Delete Quiz?',
      text: `Are you sure you want to delete "${quizTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        await quizAPI.delete(quizId);
        showSuccess('Quiz deleted successfully');
        onRefresh();
      } catch (error) {
        handleAPIError(error);
      }
    }
  };

  const handleDeleteAssignment = async (assignmentId, assignmentTitle) => {
    const result = await Swal.fire({
      title: 'Delete Assignment?',
      text: `Are you sure you want to delete "${assignmentTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        await assignmentAPI.delete(assignmentId);
        showSuccess('Assignment deleted successfully');
        onRefresh();
      } catch (error) {
        handleAPIError(error);
      }
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setShowAssignmentForm(true);
  };

  const handleTogglePublish = async (quizId, currentStatus) => {
  try {
    await quizAPI.update(quizId, { isPublished: !currentStatus });
    showSuccess(currentStatus ? 'Quiz unpublished' : 'Quiz published successfully!');
    onRefresh();
  } catch (error) {
    handleAPIError(error);
  }
};


  return (
    <div className="space-y-6">
      {/* Add Module Button */}
      <div className="card">
        <button
          onClick={handleAddModule}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Add Module
        </button>
      </div>

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules yet</h3>
          <p className="text-gray-600 mb-4">Start building your course by adding modules</p>
          <button onClick={handleAddModule} className="btn-primary">
            Add Your First Module
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module, index) => {
            const moduleQuizzes = quizzes.filter(q => {
              // Handle both ObjectId and string comparison
              if (q.module && q.module._id) {
                return q.module._id.toString() === module._id.toString();
              }
              return q.module?.toString() === module._id.toString();
            });

            const moduleAssignments = assignments.filter(a => {
              // Handle both ObjectId and string comparison
              if (a.module && a.module._id) {
                return a.module._id.toString() === module._id.toString();
              }
              return a.module?.toString() === module._id.toString();
            });
            return (
              <div key={module._id} className="card">
                {/* Module Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{module.title}</h3>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* ✅ Add Quiz Button */}
                    <button
                      onClick={() => handleAddQuiz(module._id)}
                      className="p-2 rounded-lg border border-green-300 hover:bg-green-50 transition-colors"
                      title="Add Quiz"
                    >
                      <HelpCircle className="w-4 h-4 text-green-600" />
                    </button>

                    {/* ✅ Add Assignment Button */}
                    <button
                      onClick={() => handleAddAssignment(module._id)}
                      className="p-2 rounded-lg border border-yellow-300 hover:bg-yellow-50 transition-colors"
                      title="Add Assignment"
                    >
                      <FileText className="w-4 h-4 text-yellow-600" />
                    </button>

                    {/* Add Lesson Button */}
                    <button
                      onClick={() => handleAddLesson(module._id)}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                      title="Add Lesson"
                    >
                      <PlusCircle className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* Delete Module */}
                    <button
                      onClick={() => onDeleteModule(module._id, module.title)}
                      className="p-2 rounded-lg border border-red-300 hover:bg-red-50"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>

                    {/* Expand/Collapse */}
                    <button
                      onClick={() => toggleModule(module._id)}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      {expandedModules[module._id] ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedModules[module._id] && (
                  <div className="ml-11 pt-4 border-t border-gray-200 space-y-4">
                    {/* Lessons Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Lessons ({module.lessons?.length || 0})
                      </h4>
                      {module.lessons && module.lessons.length > 0 ? (
                        <div className="space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson._id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Video className="w-4 h-4 text-gray-500" />
                                <div>
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
                              {/* <button
                                onClick={() => onDeleteLesson(lesson._id, lesson.title)}
                                className="p-2 rounded-lg hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button> */}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic py-2">
                          No lessons yet. Click "Add Lesson" to get started.
                        </p>
                      )}
                    </div>

                    {/* ✅ Quizzes Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-green-600" />
                        Quizzes ({moduleQuizzes.length})
                      </h4>
                      {moduleQuizzes.length > 0 ? (
                        <div className="space-y-2">
                          {moduleQuizzes.map((quiz) => {
                            const questionCount = quiz.questionsCount || quiz.questions?.length || 0;
                            return (
                              <div
                                key={quiz._id}
                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                              >
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{quiz.title}</h5>
                                  <p className="text-xs text-gray-600 line-clamp-1">
                                    {quiz.description}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    <span className="font-semibold text-green-700">
                                      {questionCount} questions
                                    </span>
                                    <span>•</span>
                                    <span>{quiz.timeLimit} min</span>
                                    <span>•</span>
                                    <span>{quiz.passingPercentage}% passing</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleTogglePublish(quiz._id, quiz.isPublished)}
                                    className={`p-2 rounded-lg border transition-colors ${quiz.isPublished
                                        ? 'border-green-300 bg-green-50 hover:bg-green-100'
                                        : 'border-gray-300 hover:bg-gray-50'
                                      }`}
                                    title={quiz.isPublished ? 'Published' : 'Unpublished - Click to publish'}
                                  >
                                    {quiz.isPublished ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                                    className="p-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
                                    title="Delete Quiz"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic py-2">No quizzes yet.</p>
                      )}
                    </div>

                    {/* ✅ Assignments Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-yellow-600" />
                        Assignments ({moduleAssignments.length})
                      </h4>
                      {moduleAssignments.length > 0 ? (
                        <div className="space-y-2">
                          {moduleAssignments.map((assignment) => (
                            <div
                              key={assignment._id}
                              className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                            >
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{assignment.title}</h5>
                                <p className="text-xs text-gray-600 line-clamp-1">
                                  {assignment.description}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="font-semibold text-yellow-700">
                                    {assignment.totalMarks} marks
                                  </span>
                                  <span>•</span>
                                  <span>Due: {formatDate(assignment.dueDate)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditAssignment(assignment)}
                                  className="p-2 rounded-lg border border-gray-300 hover:bg-white transition-colors"
                                  title="Edit Assignment"
                                >
                                  <Edit className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteAssignment(assignment._id, assignment.title)
                                  }
                                  className="p-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
                                  title="Delete Assignment"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic py-2">No assignments yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Link to={`/forum/${courseId}`} className="card hover:shadow-lg transition-shadow text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">View Forum</h4>
              <p className="text-xs text-gray-600">Student discussions</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Module Form Modal (Placeholder) */}
      {showModuleForm && (
        <ModuleFormModal
          courseId={courseId}
          onClose={() => setShowModuleForm(false)}
          onSuccess={() => {
            setShowModuleForm(false);
            onRefresh();
          }}
        />
      )}

      {/* Lesson Form Modal (Placeholder) */}
      {showLessonForm && selectedModule && (
        <LessonFormModal
          courseId={courseId}
          moduleId={selectedModule}
          modules={modules}
          onClose={() => {
            setShowLessonForm(false);
            setSelectedModule(null);
          }}
          onSuccess={() => {
            setShowLessonForm(false);
            setSelectedModule(null);
            onRefresh();
          }}
        />
      )}

      {/* ✅ Quiz Form Modal */}
      {showQuizForm && selectedModule && (
        <QuizFormModal
          courseId={courseId}
          moduleId={selectedModule}
          onClose={() => {
            setShowQuizForm(false);
            setSelectedModule(null);
          }}
          onSuccess={() => {
            setShowQuizForm(false);
            setSelectedModule(null);
            onRefresh();
          }}
        />
      )}

      {/* ✅ Assignment Form Modal */}
      {showAssignmentForm && (
        <AssignmentFormModal
          courseId={courseId}
          moduleId={selectedModule}
          assignment={editingAssignment}
          onClose={() => {
            setShowAssignmentForm(false);
            setSelectedModule(null);
            setEditingAssignment(null);
          }}
          onSuccess={() => {
            setShowAssignmentForm(false);
            setSelectedModule(null);
            setEditingAssignment(null);
            onRefresh();
          }}
        />
      )}

    </div>
  );
};

// Enrollments Tab Component
const EnrollmentsTab = ({ enrollments, onAction }) => {
  if (enrollments.length === 0) {
    return (
      <div className="card text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
        <p className="text-gray-600">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title mb-4">Pending Enrollment Requests</h2>
      <div className="space-y-4">
        {enrollments.map((enrollment) => (
          <div
            key={enrollment._id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                {enrollment.student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{enrollment.student.name}</h4>
                <p className="text-sm text-gray-600">{enrollment.student.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Requested {formatDate(enrollment.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAction(enrollment._id, 'approved')}
                className="btn-primary flex items-center gap-2 text-sm py-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => onAction(enrollment._id, 'rejected')}
                className="btn-danger flex items-center gap-2 text-sm py-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Module Form Modal Component (Simple version)
const ModuleFormModal = ({ courseId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await moduleAPI.create({ ...formData, course: courseId });
      showSuccess('Module created successfully');
      onSuccess();
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Module</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Module Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              rows="3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: e.target.value })}
              className="input-field"
              min="1"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Creating...' : 'Create Module'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Lesson Form Modal Component (Simple version)
const LessonFormModal = ({ courseId, moduleId, modules, onClose, onSuccess }) => {
  // ✅ Get current module to calculate next order
  const currentModule = modules.find(m => m._id === moduleId);
  const nextOrder = (currentModule?.lessons?.length || 0) + 1;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoDuration: '',
    order: nextOrder,
    isFree: false,
  });
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Check for duplicate lesson title in same module
    const existingLesson = modules
      .find(m => m._id === moduleId)
      ?.lessons?.find(l => l.title.toLowerCase().trim() === formData.title.toLowerCase().trim());

    if (existingLesson) {
      showError('A lesson with this title already exists in this module');
      setLoading(false);
      return;
    }

     // ✅ Check for duplicate order in same module
      const existingOrder = currentModule?.lessons?.find(
        l => l.order === Number(formData.order)
      );

      if (existingOrder) {
        showError(`Order ${formData.order} is already taken by "${existingOrder.title}". Please use a different order.`);
        setLoading(false);
        return;
      }
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('module', moduleId);
      data.append('course', courseId);
      data.append('videoDuration', formData.videoDuration);
      data.append('order', formData.order);
      data.append('isFree', formData.isFree);
      if (videoFile) {
        data.append('video', videoFile);
      }

      await lessonAPI.create(data);
      showSuccess('Lesson created successfully');
      onSuccess();
    } catch (error) {
      console.error('Create Lesson Error:', error);
    // ✅ Handle duplicate key error from backend
    if (error.response?.data?.message?.includes('duplicate') || 
        error.response?.data?.message?.includes('E11000')) {
      showError('A lesson with this title already exists. Please use a different title.');
    } else {
      handleAPIError(error);
    }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 my-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Lesson</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              rows="3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (seconds) *
            </label>
            <input
              type="number"
              value={formData.videoDuration}
              onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })}
              className="input-field"
              required
            />
          </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order *
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="input-field"
                min="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Suggested: {nextOrder}
              </p>
            </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFree"
              checked={formData.isFree}
              onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded"
            />
            <label htmlFor="isFree" className="text-sm text-gray-700">
              Free preview lesson
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Creating...' : 'Create Lesson'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Quiz Form Modal Component
const QuizFormModal = ({ courseId, moduleId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    passingPercentage: 70,
    maxAttempts: 3,
    questions: [],
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    options: [{ text: '', isCorrect: false }],
    marks: 1,
  });
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { text: '', isCorrect: false }],
    });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index][field] = value;

    // If setting as correct, uncheck others
    if (field === 'isCorrect' && value) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length <= 2) {
      showError('At least 2 options required');
      return;
    }
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      showError('Please enter question text');
      return;
    }
    if (currentQuestion.options.length < 2) {
      showError('Add at least 2 options');
      return;
    }
    if (!currentQuestion.options.some(opt => opt.isCorrect)) {
      showError('Select correct answer');
      return;
    }
    if (currentQuestion.options.some(opt => !opt.text.trim())) {
      showError('All options must have text');
      return;
    }

    setFormData({
      ...formData,
      questions: [...formData.questions, currentQuestion],
    });
    setCurrentQuestion({
      questionText: '',
      options: [{ text: '', isCorrect: false }],
      marks: 1,
    });
    showSuccess('Question added!');
  };

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.questions.length === 0) {
      showError('Add at least one question');
      return;
    }

    setLoading(true);

    try {
      // ✅ Properly format the payload
      const quizPayload = {
        course: courseId,
        module: moduleId, // ✅ Include module ID
        title: formData.title,
        description: formData.description,
        timeLimit: Number(formData.timeLimit),
        passingPercentage: Number(formData.passingPercentage),
        maxAttempts: Number(formData.maxAttempts),
        questions: formData.questions.map(q => ({
          questionText: q.questionText,
          options: q.options.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect
          })),
          marks: Number(q.marks)
        }))
      };

      const response = await quizAPI.create(quizPayload);

      showSuccess('Quiz created successfully!');
      onSuccess();
    } catch (error) {

      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Create Quiz</h3>
        <p className="text-sm text-gray-600 mb-4">
          This quiz will be added to the selected module
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quiz Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g., HTML Basics Quiz"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              rows="2"
              placeholder="Briefly describe what this quiz covers"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time (min) *</label>
              <input
                type="number"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                className="input-field"
                min="5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passing % *</label>
              <input
                type="number"
                value={formData.passingPercentage}
                onChange={(e) => setFormData({ ...formData, passingPercentage: e.target.value })}
                className="input-field"
                min="1"
                max="100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Attempts *</label>
              <input
                type="number"
                value={formData.maxAttempts}
                onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                className="input-field"
                min="1"
                required
              />
            </div>
          </div>

          {/* Add Question Section */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Add Question</h4>

            <div className="mb-3">
              <input
                type="text"
                value={currentQuestion.questionText}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                className="input-field"
                placeholder="Enter question text"
              />
            </div>

            <div className="space-y-2 mb-3">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Option ${index + 1}`}
                  />
                  <label className="flex items-center gap-2 px-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">Correct</span>
                  </label>
                  {currentQuestion.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={addOption} className="btn-secondary text-sm">
                + Add Option
              </button>
              <input
                type="number"
                value={currentQuestion.marks}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: e.target.value })}
                className="input-field w-20"
                min="1"
                placeholder="Marks"
              />
              <button type="button" onClick={addQuestion} className="btn-primary text-sm">
                Add Question
              </button>
            </div>
          </div>

          {/* Questions List */}
          {formData.questions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Questions Added ({formData.questions.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {formData.questions.map((q, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900 flex-1">
                        {i + 1}. {q.questionText}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeQuestion(i)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1 text-xs">
                      {q.options.map((opt, j) => (
                        <div
                          key={j}
                          className={`px-2 py-1 rounded ${opt.isCorrect ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-600'
                            }`}
                        >
                          {String.fromCharCode(65 + j)}. {opt.text}
                          {opt.isCorrect && ' ✓'}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Marks: {q.marks}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Assignment Form Modal Component
// Assignment Form Modal Component
const AssignmentFormModal = ({ courseId, moduleId, assignment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    dueDate: assignment?.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '',
    totalMarks: assignment?.totalMarks || 100,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const assignmentPayload = {
        ...formData,
        course: courseId,
        module: moduleId || assignment?.module,
        totalMarks: Number(formData.totalMarks),
      };

      if (assignment) {
        // Update existing assignment
        await assignmentAPI.update(assignment._id, assignmentPayload);
        showSuccess('Assignment updated successfully!');
      } else {
        // Create new assignment
        await assignmentAPI.create(assignmentPayload);
        showSuccess('Assignment created successfully!');
      }

      onSuccess();
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {assignment ? 'Edit Assignment' : 'Create Assignment'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {assignment
            ? 'Update assignment details'
            : 'This assignment will be added to the selected module'
          }
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g., Build a Landing Page"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              rows="4"
              placeholder="Describe what students need to do..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="input-field"
              min={getMinDate()}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Students must submit before this deadline
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Marks *
            </label>
            <input
              type="number"
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
              className="input-field"
              min="1"
              max="1000"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Saving...' : assignment ? 'Update Assignment' : 'Create Assignment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};




export default ManageCourse;
