// src/pages/student/AssignmentsPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // 🔥 useSearchParams add
import { assignmentAPI } from '../../api/endpoints';
import AssignmentCard from './AssignmentCard';
import { ArrowLeft } from 'lucide-react'; // Aapke icons

const AssignmentsPage = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchAssignments();
    }
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getByCourse(courseId);
      setAssignments(response.data.data || []);
      setError('');
    } catch (error) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 py-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button + Header */}
        <div className="mb-10 flex items-center gap-4">
          <Link
            to={`/student/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Course
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📚 Assignments</h1>
            <p className="text-xl text-gray-600">Course assignments</p>
          </div>
        </div>

        {/* Rest same as before */}
        <div className="grid gap-6">
          {assignments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl p-12 shadow-sm">
              <FileText className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No assignments</h3>
              <p className="text-gray-600 mb-6">Check back later</p>
            </div>
          ) : (
            assignments.map((assignment) => (
              <AssignmentCard 
                key={assignment._id} 
                assignment={assignment}
                onSubmit={fetchAssignments}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;
