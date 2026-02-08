import { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { courseAPI, assignmentAPI, getFileURL } from '../../api/endpoints';
import { handleAPIError, showSuccess } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';

const Grading = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    marksObtained: '',
    feedback: '',
  });

  useEffect(() => {
    fetchInstructorAssignments();
  }, []);

  // Fetch all assignments for instructor's courses
  const fetchInstructorAssignments = async () => {
    try {
      setLoading(true);
      
      // Get instructor's courses first
      const coursesRes = await courseAPI.getMyCourses();
      const courses = coursesRes.data.data;

      // Get all assignments from these courses
      const allAssignments = [];
      for (const course of courses) {
        try {
          const assignmentsRes = await assignmentAPI.getByCourse(course._id);
          const courseAssignments = assignmentsRes.data.data.map(a => ({
            ...a,
            courseName: course.title
          }));
          allAssignments.push(...courseAssignments);
        } catch (error) {
          console.error(`Error fetching assignments for course ${course._id}:`, error);
        }
      }

      setAssignments(allAssignments);
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch submissions for selected assignment
  const fetchSubmissions = async (assignmentId) => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getSubmissions(assignmentId);
      setSubmissions(response.data.data || []);
      setSelectedAssignment(assignmentId);
    } catch (error) {
      handleAPIError(error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission) => {
    setGradingSubmission(submission);
    setGradeForm({
      marksObtained: submission.marksObtained || '',
      feedback: submission.feedback || '',
    });
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();

    if (!gradeForm.marksObtained || !gradeForm.feedback) {
      showError('Please provide both marks and feedback');
      return;
    }

    const assignment = assignments.find(a => 
      submissions.some(s => s._id === gradingSubmission._id && s.assignment === a._id)
    );

    if (assignment && Number(gradeForm.marksObtained) > assignment.totalMarks) {
      showError(`Marks cannot exceed ${assignment.totalMarks}`);
      return;
    }

    try {
      await assignmentAPI.gradeSubmission(gradingSubmission._id, gradeForm);
      showSuccess('Submission graded successfully!');
      setGradingSubmission(null);
      setGradeForm({ marksObtained: '', feedback: '' });
      // Refresh submissions
      if (selectedAssignment) {
        fetchSubmissions(selectedAssignment);
      }
    } catch (error) {
      handleAPIError(error);
    }
  };

  if (loading && !selectedAssignment) {
    return <Loader fullScreen />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="page-title">Grade Assignments</h1>
      <p className="text-gray-600 mb-6">Review and grade student submissions</p>

      {/* Assignments List */}
      {!selectedAssignment ? (
        <div>
          {assignments.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-600">Create assignments in your courses to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{assignment.courseName}</p>
                      <p className="text-xs text-gray-500">
                        Due: {formatDate(assignment.dueDate)}
                      </p>
                    </div>
                    <span className="badge badge-primary">{assignment.totalMarks} marks</span>
                  </div>
                  <button
                    onClick={() => fetchSubmissions(assignment._id)}
                    className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Submissions
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Submissions List */
        <div>
          <button
            onClick={() => {
              setSelectedAssignment(null);
              setSubmissions([]);
            }}
            className="mb-6 text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Assignments
          </button>

          {loading ? (
            <Loader />
          ) : submissions.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">Students haven't submitted their work yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission._id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {submission.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{submission.student.name}</h4>
                        <p className="text-sm text-gray-600">{submission.student.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {formatDate(submission.submittedAt)}
                        </p>
                        {submission.comments && (
                          <p className="text-sm text-gray-700 mt-2 italic">"{submission.comments}"</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        submission.status === 'graded'
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>

                  {/* File Download */}
                  <div className="mb-4">
                    <a
                      href={getFileURL(submission.fileUrl)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Submission ({submission.fileName})
                    </a>
                  </div>

                  {/* Grading Section */}
                  {submission.status === 'graded' ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-green-900">Graded</span>
                        <span className="text-lg font-bold text-green-900">
                          {submission.marksObtained} / {submission.assignment.totalMarks}
                        </span>
                      </div>
                      <p className="text-sm text-green-800">
                        <strong>Feedback:</strong> {submission.feedback}
                      </p>
                      <p className="text-xs text-green-700 mt-2">
                        Graded on: {formatDate(submission.gradedAt)}
                      </p>
                      <button
                        onClick={() => handleGradeSubmission(submission)}
                        className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Edit Grade
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGradeSubmission(submission)}
                      className="w-full btn-primary text-sm py-2"
                    >
                      Grade Submission
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Grade Submission</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Student: <strong>{gradingSubmission.student.name}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Total Marks: <strong>{gradingSubmission.assignment?.totalMarks || 'N/A'}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmitGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks Obtained *
                </label>
                <input
                  type="number"
                  value={gradeForm.marksObtained}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, marksObtained: e.target.value })
                  }
                  className="input-field"
                  min="0"
                  max={gradingSubmission.assignment?.totalMarks}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback *
                </label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, feedback: e.target.value })
                  }
                  className="input-field resize-none"
                  rows="4"
                  placeholder="Provide constructive feedback..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-primary">
                  Submit Grade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGradingSubmission(null);
                    setGradeForm({ marksObtained: '', feedback: '' });
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grading;
