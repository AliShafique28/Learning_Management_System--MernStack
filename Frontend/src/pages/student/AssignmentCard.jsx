// src/components/student/AssignmentCard.jsx
import { useState, useEffect } from 'react';
import { assignmentAPI } from '../../api/endpoints';
import { toast } from 'react-toastify';
import { format, isPast } from 'date-fns';

const AssignmentCard = ({ assignment, onSubmit }) => {
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [comments, setComments] = useState('');

    useEffect(() => {
        fetchSubmission();
    }, [assignment._id]);

    // const fetchSubmission = async () => {
    //     try {
    //         const response = await assignmentAPI.getMySubmissions();
    //         const mySubmission = response.data.data.find(
    //             (sub) => sub.assignment._id === assignment._id
    //         );
    //         setSubmission(mySubmission);
    //     } catch (error) {
    //         console.error('Fetch submission error:', error);
    //     }
    // };
    const fetchSubmission = async () => {
        try {
            const response = await assignmentAPI.getMySubmissions();
            const submissions = response.data.data || [];

            // 🔥 SAFE CHECK
            const mySubmission = submissions.find((sub) =>
                sub.assignment && sub.assignment._id === assignment._id
            );

            setSubmission(mySubmission || null);
        } catch (error) {
            console.error('Fetch submission error:', error);
            setSubmission(null);
        }
    };


    //   const handleFileChange = (e) => {
    //     const selectedFile = e.target.files[0];
    //     if (selectedFile && selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    //       setFile(selectedFile);
    //     } else {
    //       toast.error('Please select a valid DOCX file');
    //       e.target.value = '';
    //     }
    //   };
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        console.log('🧪 Selected file:', selectedFile); // 🔥 Debug

        if (selectedFile) {
            // 🔥 REAL FILE CHECK
            if (selectedFile.size > 0 && selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                setFile(selectedFile);
                toast.success(`✅ ${selectedFile.name} selected (${(selectedFile.size / 1024).toFixed(1)}KB)`);
            } else {
                toast.error('❌ Please select a valid DOCX file');
                e.target.value = '';
                setFile(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('🚀 Submit file check:', {
            file,
            hasFile: !!file,
            fileSize: file?.size,
            fileType: file?.type
        });
        if (!file || file.size === 0) {
            return toast.error('❌ No valid file selected');
        }

        const formData = new FormData();
        formData.append('assignment', file);
        if (comments) formData.append('comments', comments);

        // 🔥 VERIFICATION
        const entries = Array.from(formData.entries());
        console.log('📤 FINAL SEND:', entries.map(([k, v]) => `${k}: ${v.name || v}`));

        try {
            setUploading(true);
            await assignmentAPI.submit(assignment._id, formData);
            toast.success('Assignment submitted successfully! 🎉');
            setFile(null);
            setComments('');
            fetchSubmission(); // Refresh submission status
            onSubmit(); // Refresh parent list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Submission failed');
        } finally {
            setUploading(false);
        }
    };

    const isOverdue = isPast(new Date(assignment.dueDate));
    const isSubmitted = !!submission;
    const canSubmit = !isSubmitted || submission.status === 'resubmit';

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h3>
                    <p className="text-gray-600 mb-2">{assignment.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-blue-600">
                            {assignment.totalMarks} marks
                        </span>
                        <span className="flex items-center gap-1">
                            📅 Due {format(new Date(assignment.dueDate), 'MMM dd, yyyy hh:mm a')}
                            {isOverdue && (
                                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                    Overdue
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Submission Status */}
            {submission && (
                <div className={`mb-6 p-4 rounded-xl ${submission.status === 'graded' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200 border'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-lg">
                                {submission.status === 'graded' ? '✅ Graded' : '📤 Submitted'}
                            </div>
                            {submission.status === 'graded' && (
                                <div className="mt-2">
                                    <div className="text-2xl font-bold text-green-600">
                                        {submission.marksObtained}/{assignment.totalMarks}
                                    </div>
                                    {submission.feedback && (
                                        <p className="text-sm text-gray-700 mt-1 italic">
                                            "{submission.feedback}"
                                        </p>
                                    )}
                                </div>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                                Submitted: {format(new Date(submission.submittedAt), 'MMM dd, yyyy')}
                            </p>
                        </div>
                        {submission.status !== 'graded' && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                {submission.status === 'resubmit' ? 'Resubmit' : 'Pending Review'}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Submit Form */}
            {(!submission || submission.status === 'resubmit') && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            📎 Upload DOCX File <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="file"
                            accept=".docx"
                            onChange={handleFileChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        {file && (
                            <p className="mt-1 text-sm text-green-600">{file.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            💬 Comments (Optional)
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                            placeholder="Any additional comments or questions..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || !file}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Submitting...
                            </span>
                        ) : isSubmitted ? (
                            'Resubmit Assignment'
                        ) : (
                            'Submit Assignment'
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default AssignmentCard;
