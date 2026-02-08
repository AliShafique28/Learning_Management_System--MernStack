import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Pin,
  Edit2,
  Trash2,
  MessageSquare,
  User,
  MoreVertical,
} from 'lucide-react';
import { forumAPI } from '../../api/endpoints';
import { useSocket } from '../../context/SocketContext';
import useAuthStore from '../../store/authStore';
import { handleAPIError, showSuccess } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatRelativeTime, getInitials } from '../../utils/formatters';
import Swal from 'sweetalert2';

const Forum = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { socket, connected, joinForum, leaveForum } = useSocket();
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);

  const [forum, setForum] = useState(null);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchForum();
  }, [courseId]);

  useEffect(() => {
    if (forum && connected && socket) {
      console.log('🚀 Joining forum room:', forum._id);
      joinForum(forum._id);

      // Listen for real-time events
      socket.on('thread-created', handleThreadCreated);
      socket.on('thread-updated', handleThreadUpdated);
      socket.on('thread-deleted', handleThreadDeleted);
      socket.on('thread-pinned', handleThreadPinned);
      socket.on('reply-created', handleReplyCreated);
      socket.on('reply-updated', handleReplyUpdated);
      socket.on('reply-deleted', handleReplyDeleted);

      return () => {
        leaveForum(forum._id);
        socket.off('thread-created', handleThreadCreated);
        socket.off('thread-updated', handleThreadUpdated);
        socket.off('thread-deleted', handleThreadDeleted);
        socket.off('thread-pinned', handleThreadPinned);
        socket.off('reply-created', handleReplyCreated);
        socket.off('reply-updated', handleReplyUpdated);
        socket.off('reply-deleted', handleReplyDeleted);
      };
    }
  }, [forum, connected, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedThread?.replies]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // const fetchForum = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await forumAPI.getByCourse(courseId);
  //     const forumData = response.data.data;
  //     setForum(forumData);
  //     setThreads(forumData.threads || []);
  //   } catch (error) {
  //     handleAPIError(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchForum = async () => {
    try {
      setLoading(true);
      const response = await forumAPI.getByCourse(courseId);
      const forumData = response.data.data;
      setForum(forumData);
      setThreads(forumData.threads || []);

      // agar selectedThread set hai to uska fresh version yahan se nikal lo
      if (selectedThread) {
        const updated = forumData.threads?.find(t => t._id === selectedThread._id);
        setSelectedThread(updated || null);
      }
    } catch (error) {
      handleAPIError(error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time event handlers
  const handleThreadCreated = (data) => {
    if (data.forumId === forum._id) {
      setThreads((prev) => [data.thread, ...prev]);
      showSuccess('New discussion thread created!');
    }
  };

  const handleThreadUpdated = (data) => {
    if (data.forumId === forum._id) {
      setThreads((prev) =>
        prev.map((t) => (t._id === data.threadId ? { ...t, ...data.thread } : t))
      );
    }
  };

  const handleThreadDeleted = (data) => {
    if (data.forumId === forum._id) {
      setThreads((prev) => prev.filter((t) => t._id !== data.threadId));
      if (selectedThread?._id === data.threadId) {
        setSelectedThread(null);
      }
    }
  };

  const handleThreadPinned = (data) => {
    if (data.forumId === forum._id) {
      setThreads((prev) =>
        prev.map((t) =>
          t._id === data.threadId ? { ...t, isPinned: data.isPinned } : t
        )
      );
    }
  };

  const handleReplyCreated = (data) => {
    if (data.forumId === forum._id && data.threadId === selectedThread?._id) {
      setSelectedThread((prev) => ({
        ...prev,
        replies: [...(prev.replies || []), data.reply],
      }));
    }
  };

  const handleReplyUpdated = (data) => {
    if (data.forumId === forum._id && data.threadId === selectedThread?._id) {
      setSelectedThread((prev) => ({
        ...prev,
        replies: prev.replies.map((r) =>
          r._id === data.replyId ? { ...r, ...data.reply } : r
        ),
      }));
    }
  };

  const handleReplyDeleted = (data) => {
    if (data.forumId === forum._id && data.threadId === selectedThread?._id) {
      setSelectedThread((prev) => ({
        ...prev,
        replies: prev.replies.filter((r) => r._id !== data.replyId),
      }));
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();

    if (!newThread.title.trim() || !newThread.content.trim()) {
      return;
    }

    setSending(true);

    try {
      await forumAPI.createThread(forum._id, newThread);
      setNewThread({ title: '', content: '' });
      setShowNewThreadForm(false);

      await fetchForum();
      // Real-time update will be handled by socket event
    } catch (error) {
      handleAPIError(error);
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();

    if (!replyContent.trim()) return;

    setSending(true);

    try {
      await forumAPI.replyToThread(forum._id, selectedThread._id, {
        content: replyContent,
      });
      setReplyContent('');
      await fetchForum();
      // Real-time update will be handled by socket event
    } catch (error) {
      handleAPIError(error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteThread = async (threadId) => {
    const result = await Swal.fire({
      title: 'Delete Thread?',
      text: 'This will delete the thread and all its replies.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        await forumAPI.deleteThread(forum._id, threadId);
        // Real-time update will be handled by socket event
        await fetchForum();
        setSelectedThread(null);
      } catch (error) {
        handleAPIError(error);
      }
    }
  };

  const handlePinThread = async (threadId) => {
    try {
      await forumAPI.togglePin(forum._id, threadId);
      await fetchForum();
    } catch (error) {
      handleAPIError(error);
    }
  };

  const handleDeleteReply = async (replyId) => {
    const result = await Swal.fire({
      title: 'Delete Reply?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        await forumAPI.deleteReply(replyId);
        await fetchForum();
      } catch (error) {
        handleAPIError(error);
      }
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!forum) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Forum not found</p>
      </div>
    );
  }

  // Sort threads: pinned first, then by date
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Course Forum</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewThreadForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              New Discussion
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Threads List */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Discussions</h2>
              {sortedThreads.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">No discussions yet</p>
                  <button
                    onClick={() => setShowNewThreadForm(true)}
                    className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Start the first discussion
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {sortedThreads.map((thread) => (
                    <button
                      key={thread._id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${selectedThread?._id === thread._id
                        ? 'bg-primary-50 border-2 border-primary-600'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {thread.isPinned && (
                              <Pin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            )}
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              {thread.title}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                            {thread.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{thread.author?.name}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(thread.createdAt)}</span>
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-xs text-gray-500">
                          {thread.replies?.length || 0} replies
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Thread View */}
          <div className="lg:col-span-2">
            {selectedThread ? (
              <div className="card">
                {/* Thread Header */}
                <div className="pb-4 border-b border-gray-200 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {getInitials(selectedThread.author?.name)}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-900">
                          {selectedThread.title}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{selectedThread.author?.name}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(selectedThread.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Thread Actions */}
                    {(user._id === selectedThread.author?._id || user.role === 'instructor') && (
                      <div className="flex items-center gap-2">
                        {user.role === 'instructor' && (
                          <button
                            onClick={() => handlePinThread(selectedThread._id)}
                            className={`p-2 rounded-lg transition-colors ${selectedThread.isPinned
                              ? 'bg-primary-100 text-primary-600'
                              : 'hover:bg-gray-100 text-gray-600'
                              }`}
                            title="Pin thread"
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteThread(selectedThread._id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete thread"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700">{selectedThread.content}</p>
                </div>

                {/* Replies */}
                <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                  {selectedThread.replies && selectedThread.replies.length > 0 ? (
                    selectedThread.replies.map((reply) => (
                      <div key={reply._id} className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                          {getInitials(reply.author?.name)}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm text-gray-900">
                                {reply.author?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatRelativeTime(reply.createdAt)}
                              </p>
                            </div>
                            {(user._id === reply.author?._id ||
                              user.role === 'instructor') && (
                                <button
                                  onClick={() => handleDeleteReply(reply._id)}
                                  className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                                  title="Delete reply"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                          </div>
                          <p className="text-gray-700 text-sm">{reply.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No replies yet. Be the first to reply!
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <form onSubmit={handleReply} className="pt-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 input-field"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !replyContent.trim()}
                        className="btn-primary px-4 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="card text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a discussion
                </h3>
                <p className="text-gray-600">
                  Choose a thread from the list to view and participate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThreadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Start New Discussion
            </h3>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) =>
                    setNewThread({ ...newThread, title: e.target.value })
                  }
                  className="input-field"
                  placeholder="What's your question or topic?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={newThread.content}
                  onChange={(e) =>
                    setNewThread({ ...newThread, content: e.target.value })
                  }
                  className="input-field resize-none"
                  rows="4"
                  placeholder="Provide more details..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 btn-primary"
                >
                  {sending ? 'Creating...' : 'Create Thread'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewThreadForm(false);
                    setNewThread({ title: '', content: '' });
                  }}
                  className="flex-1 btn-secondary"
                  disabled={sending}
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

export default Forum;




// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   ArrowLeft,
//   Send,
//   Pin,
//   Trash2,
//   MessageSquare,
//   RefreshCw,
// } from 'lucide-react';
// import { forumAPI } from '../../api/endpoints';
// import { useSocket } from '../../context/SocketContext';
// import useAuthStore from '../../store/authStore';
// import { handleAPIError, showSuccess } from '../../utils/errorHandler';
// import Loader from '../../components/common/Loader';
// import { formatRelativeTime, getInitials } from '../../utils/formatters';
// import Swal from 'sweetalert2';

// const Forum = () => {
//   const { courseId } = useParams();
//   const navigate = useNavigate();
//   const { socket, connected, joinForum, leaveForum } = useSocket();
//   const { user } = useAuthStore();
//   const messagesEndRef = useRef(null);

//   const [forum, setForum] = useState(null);
//   const [threads, setThreads] = useState([]);
//   const [selectedThread, setSelectedThread] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showNewThreadForm, setShowNewThreadForm] = useState(false);
//   const [newThread, setNewThread] = useState({ title: '', content: '' });
//   const [replyContent, setReplyContent] = useState('');
//   const [sending, setSending] = useState(false);

//   // 🔥 1. Fetch Forum Data
//   const fetchForum = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await forumAPI.getByCourse(courseId);
//       const forumData = response.data.data;
//       setForum(forumData);
//       setThreads(forumData.threads || []);
//     } catch (error) {
//       handleAPIError(error);
//     } finally {
//       setLoading(false);
//     }
//   }, [courseId]);

//   useEffect(() => {
//     fetchForum();
//   }, [fetchForum]);

//   // 🔥 2. PERFECT SOCKET HANDLING - No stale closures
//   useEffect(() => {
//     //************************************************************************************************ */
//     console.log('🔥 SOCKET STATUS:', { forumId: forum?._id, connected, hasSocket: !!socket });

//     if (!forum?._id || !connected || !socket) return;
//     //************************************************************************************************ */

//     console.log('🚀 Joining forum:', forum._id);
//     joinForum(forum._id);

//     // Simple handlers with functional updates
//     const handleThreadCreated = (data) => {
//       // if (data.forumId === forum._id) {
//       //   setThreads(prev => [data.thread, ...prev]);
//       //   showSuccess('New thread created!');
//       // }

//       console.log('🎉 THREAD DATA RECEIVED:', data); // Ye print hoga?
//       // 🔥 FORCE UPDATE - Bypass forumId check
//       setThreads(prev => {
//         console.log('🔥 OLD THREADS COUNT:', prev.length);
//         const newThreads = [data.thread, ...prev];
//         console.log('🔥 NEW THREADS COUNT:', newThreads.length);
//         return newThreads;
//       });
//       showSuccess('New thread LIVE!');
//     };

//     const handleThreadUpdated = (data) => {
//       if (data.forumId === forum._id) {
//         setThreads(prev =>
//           prev.map(t => t._id === data.threadId ? { ...t, ...data.thread } : t)
//         );
//       }
//     };

//     const handleThreadDeleted = (data) => {
//       if (data.forumId === forum._id) {
//         setThreads(prev => prev.filter(t => t._id !== data.threadId));
//         setSelectedThread(prev => prev?._id === data.threadId ? null : prev);
//       }
//     };

//     const handleThreadPinned = (data) => {
//       if (data.forumId === forum._id) {
//         setThreads(prev =>
//           prev.map(t => t._id === data.threadId ? { ...t, isPinned: data.isPinned } : t)
//         );
//       }
//     };

//     const handleReplyCreated = (data) => {
//       if (data.forumId === forum._id) {
//         setSelectedThread(prev => {
//           if (!prev || prev._id !== data.threadId) return prev;
//           return {
//             ...prev,
//             replies: [...(prev.replies || []), data.reply]
//           };
//         });
//       }
//     };

//     const handleReplyUpdated = (data) => {
//       if (data.forumId === forum._id) {
//         setSelectedThread(prev => {
//           if (!prev || prev._id !== data.threadId) return prev;
//           return {
//             ...prev,
//             replies: prev.replies.map(r =>
//               r._id === data.replyId ? { ...r, ...data.reply } : r
//             )
//           };
//         });
//       }
//     };

//     const handleReplyDeleted = (data) => {
//       if (data.forumId === forum._id) {
//         setSelectedThread(prev => {
//           if (!prev || prev._id !== data.threadId) return prev;
//           return {
//             ...prev,
//             replies: prev.replies.filter(r => r._id !== data.replyId)
//           };
//         });
//       }
//     };
//     //********************************************************** */
//     socket.onAny((event, data) => {
//       console.log('📨 ALL SOCKET EVENTS:', event, data?.forumId);
//     });
//     // Attach listeners
//     socket.on('thread-created', handleThreadCreated);
//     socket.on('thread-updated', handleThreadUpdated);
//     socket.on('thread-deleted', handleThreadDeleted);
//     socket.on('thread-pinned', handleThreadPinned);
//     socket.on('reply-created', handleReplyCreated);
//     socket.on('reply-updated', handleReplyUpdated);
//     socket.on('reply-deleted', handleReplyDeleted);

//     // Cleanup
//     return () => {
//       console.log('🧹 Leaving forum:', forum._id);
//       leaveForum(forum._id);
//       socket.off('thread-created', handleThreadCreated);
//       socket.off('thread-updated', handleThreadUpdated);
//       socket.off('thread-deleted', handleThreadDeleted);
//       socket.off('thread-pinned', handleThreadPinned);
//       socket.off('reply-created', handleReplyCreated);
//       socket.off('reply-updated', handleReplyUpdated);
//       socket.off('reply-deleted', handleReplyDeleted);
//     };
//   }, [forum?._id, connected, socket, joinForum, leaveForum]); // ✅ Clean dependencies

//   // 🔥 3. Auto scroll
//   useEffect(() => {
//     if (selectedThread?.replies) {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, [selectedThread?.replies]);

//   // 🔥 4. Create Thread
//   const handleCreateThread = async (e) => {
//     e.preventDefault();
//     if (!newThread.title.trim() || !newThread.content.trim()) return;

//     setSending(true);
//     try {
//       await forumAPI.createThread(forum._id, newThread);
//       setNewThread({ title: '', content: '' });
//       setShowNewThreadForm(false);
//       showSuccess('Thread created!');
//       // ✅ Socket will update list automatically
//       setTimeout(async () => {
//         await fetchForum();

//       }, 300);
//     } catch (error) {
//       handleAPIError(error);
//     } finally {
//       setSending(false);
//     }
//   };

//   // 🔥 5. Reply
//   const handleReply = async (e) => {
//     e.preventDefault();
//     if (!replyContent.trim()) return;

//     setSending(true);
//     try {
//       await forumAPI.replyToThread(forum._id, selectedThread._id, {
//         content: replyContent,
//       });
//       setReplyContent('');
//       // ✅ Socket will update automatically
//     } catch (error) {
//       handleAPIError(error);
//     } finally {
//       setSending(false);
//     }
//   };

//   // 🔥 6. Delete Thread
//   const handleDeleteThread = async (threadId) => {
//     const result = await Swal.fire({
//       title: 'Delete Thread?',
//       text: 'This will delete the thread and all replies.',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#ef4444',
//       confirmButtonText: 'Yes, delete!',
//     });

//     if (result.isConfirmed) {
//       try {
//         await forumAPI.deleteThread(forum._id, threadId);
//         showSuccess('Thread deleted!');
//       } catch (error) {
//         handleAPIError(error);
//       }
//     }
//   };

//   // 🔥 7. Pin Thread
//   const handlePinThread = async (threadId) => {
//     try {
//       await forumAPI.togglePin(forum._id, threadId);
//       showSuccess('Pin status updated!');
//     } catch (error) {
//       handleAPIError(error);
//     }
//   };

//   // 🔥 8. Delete Reply
//   const handleDeleteReply = async (replyId) => {
//     const result = await Swal.fire({
//       title: 'Delete Reply?',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#ef4444',
//       confirmButtonText: 'Yes, delete!',
//     });

//     if (result.isConfirmed) {
//       try {
//         await forumAPI.deleteReply(replyId);
//         showSuccess('Reply deleted!');
//       } catch (error) {
//         handleAPIError(error);
//       }
//     }
//   };

//   const handleRefresh = () => fetchForum();

//   if (loading) return <Loader fullScreen />;
//   if (!forum) return (
//     <div className="p-6 text-center">
//       <p className="text-gray-600">Forum not found</p>
//     </div>
//   );

//   const sortedThreads = [...threads].sort((a, b) => {
//     if (a.isPinned !== b.isPinned) return b.isPinned ? -1 : 1;
//     return new Date(b.createdAt) - new Date(a.createdAt);
//   });

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => navigate(-1)}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-all"
//               >
//                 <ArrowLeft className="w-5 h-5 text-gray-600" />
//               </button>
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Course Forum</h1>
//                 <div className="flex items-center gap-2 mt-1 text-sm">
//                   <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
//                   <span>{connected ? 'Live' : 'Offline'}</span>
//                   <button
//                     onClick={handleRefresh}
//                     className="p-1 hover:bg-gray-100 rounded transition-all"
//                     title="Refresh"
//                   >
//                     <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
//                   </button>
//                 </div>
//               </div>
//             </div>
//             <button
//               onClick={() => setShowNewThreadForm(true)}
//               className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
//             >
//               <MessageSquare className="w-5 h-5" />
//               New Thread
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto p-6">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Threads List */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-lg shadow-sm border p-6">
//               <h2 className="font-semibold text-xl mb-6">Discussions</h2>
//               {sortedThreads.length === 0 ? (
//                 <div className="text-center py-12">
//                   <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//                   <p className="text-gray-500 mb-4">No discussions yet</p>
//                   <button
//                     onClick={() => setShowNewThreadForm(true)}
//                     className="text-primary-600 hover:text-primary-700 font-medium text-sm"
//                   >
//                     Start first discussion
//                   </button>
//                 </div>
//               ) : (
//                 <div className="space-y-3 max-h-[70vh] overflow-y-auto">
//                   {sortedThreads.map((thread) => (
//                     <button
//                       key={thread._id}
//                       onClick={() => setSelectedThread(thread)}
//                       className={`w-full text-left p-4 rounded-xl transition-all border-2 ${selectedThread?._id === thread._id
//                         ? 'bg-blue-50 border-blue-500 shadow-md'
//                         : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:shadow-sm'
//                         }`}
//                     >
//                       <div className="flex items-start justify-between gap-3">
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 mb-2">
//                             {thread.isPinned && (
//                               <Pin className="w-4 h-4 text-blue-600" />
//                             )}
//                             <h3 className="font-semibold text-gray-900 truncate">
//                               {thread.title}
//                             </h3>
//                           </div>
//                           <p className="text-sm text-gray-600 line-clamp-2 mb-2">
//                             {thread.content}
//                           </p>
//                           <div className="flex items-center gap-2 text-xs text-gray-500">
//                             <span>{thread.author?.name}</span>
//                             <span>•</span>
//                             <span>{formatRelativeTime(thread.createdAt)}</span>
//                           </div>
//                         </div>
//                         <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
//                           {thread.replies?.length || 0}
//                         </span>
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Thread Detail */}
//           <div className="lg:col-span-2">
//             {selectedThread ? (
//               <div className="bg-white rounded-lg shadow-sm border p-6">
//                 {/* Thread Header */}
//                 <div className="border-b pb-6 mb-6">
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="flex items-center gap-4">
//                       <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
//                         {getInitials(selectedThread.author?.name)}
//                       </div>
//                       <div className="flex-1">
//                         <h2 className="text-2xl font-bold text-gray-900 mb-1">
//                           {selectedThread.title}
//                         </h2>
//                         <div className="flex items-center gap-2 text-sm text-gray-500">
//                           <span>{selectedThread.author?.name}</span>
//                           <span>•</span>
//                           <span>{formatRelativeTime(selectedThread.createdAt)}</span>
//                         </div>
//                       </div>
//                     </div>
//                     {(user._id === selectedThread.author?._id || user.role === 'instructor') && (
//                       <div className="flex items-center gap-2">
//                         {user.role === 'instructor' && (
//                           <button
//                             onClick={() => handlePinThread(selectedThread._id)}
//                             className={`p-2 rounded-lg transition-all ${selectedThread.isPinned
//                               ? 'bg-blue-100 text-blue-600 shadow-sm'
//                               : 'hover:bg-gray-100 text-gray-600'
//                               }`}
//                           >
//                             <Pin className="w-5 h-5" />
//                           </button>
//                         )}
//                         <button
//                           onClick={() => handleDeleteThread(selectedThread._id)}
//                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
//                         >
//                           <Trash2 className="w-5 h-5" />
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                   <p className="text-gray-700 leading-relaxed">{selectedThread.content}</p>
//                 </div>

//                 {/* Replies */}
//                 <div className="space-y-4 mb-8 max-h-[500px] overflow-y-auto">
//                   {selectedThread.replies?.length > 0 ? (
//                     selectedThread.replies.map((reply) => (
//                       <div key={reply._id} className="flex gap-4">
//                         <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
//                           {getInitials(reply.author?.name)}
//                         </div>
//                         <div className="flex-1 bg-gray-50 rounded-xl p-4">
//                           <div className="flex items-start justify-between mb-2">
//                             <div>
//                               <p className="font-semibold text-sm text-gray-900">
//                                 {reply.author?.name}
//                               </p>
//                               <p className="text-xs text-gray-500">
//                                 {formatRelativeTime(reply.createdAt)}
//                               </p>
//                             </div>
//                             {(user._id === reply.author?._id || user.role === 'instructor') && (
//                               <button
//                                 onClick={() => handleDeleteReply(reply._id)}
//                                 className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
//                               >
//                                 <Trash2 className="w-4 h-4" />
//                               </button>
//                             )}
//                           </div>
//                           <p className="text-sm text-gray-700">{reply.content}</p>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-center py-12 text-gray-500">
//                       <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
//                       <p>Be the first to reply!</p>
//                     </div>
//                   )}
//                   <div ref={messagesEndRef} />
//                 </div>

//                 {/* Reply Form */}
//                 <form onSubmit={handleReply} className="border-t pt-6">
//                   <div className="flex items-start gap-4">
//                     <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
//                       {getInitials(user.name)}
//                     </div>
//                     <div className="flex-1 flex gap-3">
//                       <input
//                         type="text"
//                         value={replyContent}
//                         onChange={(e) => setReplyContent(e.target.value)}
//                         placeholder="Reply to discussion..."
//                         className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         disabled={sending}
//                       />
//                       <button
//                         type="submit"
//                         disabled={sending || !replyContent.trim()}
//                         className="btn-primary px-6 py-3 flex items-center gap-2 whitespace-nowrap"
//                       >
//                         <Send className="w-4 h-4" />
//                         {sending ? 'Sending...' : 'Send'}
//                       </button>
//                     </div>
//                   </div>
//                 </form>
//               </div>
//             ) : (
//               <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
//                 <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-6" />
//                 <h3 className="text-2xl font-semibold text-gray-900 mb-2">
//                   Select a discussion
//                 </h3>
//                 <p className="text-gray-600 max-w-md mx-auto">
//                   Choose a thread from the left to view messages and join the conversation
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* New Thread Modal */}
//       {showNewThreadForm && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-8 border-b">
//               <h3 className="text-2xl font-bold text-gray-900">New Discussion</h3>
//             </div>
//             <form onSubmit={handleCreateThread} className="p-8 space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Title *
//                 </label>
//                 <input
//                   type="text"
//                   value={newThread.title}
//                   onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="What's your question?"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Details *
//                 </label>
//                 <textarea
//                   value={newThread.content}
//                   onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
//                   rows="4"
//                   className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
//                   placeholder="Describe your question or topic in detail..."
//                   required
//                 />
//               </div>
//               <div className="flex gap-4 pt-4">
//                 <button
//                   type="submit"
//                   disabled={sending}
//                   className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {sending ? 'Creating...' : 'Create Thread'}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowNewThreadForm(false);
//                     setNewThread({ title: '', content: '' });
//                   }}
//                   disabled={sending}
//                   className="flex-1 bg-gray-100 text-gray-900 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Forum;
