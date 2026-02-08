const Forum = require('../models/Forum');
const ForumReply = require('../models/ForumReply');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Helper function to emit socket events
const emitForumEvent = (req, event, data) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`forum-${data.forumId}`).emit(event, data);
  }
};

// @desc    Get forum by course ID
// @route   GET /api/forums/course/:courseId
// @access  Private
const getForumByCourse = async (req, res) => {
  try {
    let forum = await Forum.findOne({ course: req.params.courseId })
      .populate('threads.author', 'name role');

    if (!forum) {
      // Create forum if doesn't exist
      forum = await Forum.create({ course: req.params.courseId });
    }

    // Get replies for each thread
    const threadsWithReplies = await Promise.all(
      forum.threads.map(async (thread) => {
        const replies = await ForumReply.find({ 
          forum: forum._id, 
          threadId: thread._id 
        })
          .populate('author', 'name role')
          .sort('createdAt');

        return {
          ...thread.toObject(),
          replies
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        _id: forum._id,
        course: forum.course,
        threads: threadsWithReplies
      }
    });
  } catch (error) {
    console.error('Get Forum Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create discussion thread
// @route   POST /api/forums/:forumId/threads
// @access  Private
const createThread = async (req, res) => {
  try {
    const { title, content } = req.body;

    const forum = await Forum.findById(req.params.forumId).populate('course');

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    // Check if user is enrolled or is instructor
    const isInstructor = forum.course.instructor.toString() === req.user._id.toString();
    
    if (!isInstructor) {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: forum.course._id,
        status: 'approved'
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to post in the forum'
        });
      }
    }

    // Add thread
    forum.threads.push({
      title,
      content,
      author: req.user._id,
      isPinned: false
    });

    await forum.save();

    const newThread = forum.threads[forum.threads.length - 1];

    // Populate author details
    await forum.populate('threads.author', 'name role');
    const populatedThread = forum.threads.id(newThread._id);

    // ⚡ Emit real-time event
    emitForumEvent(req, 'thread-created', {
      forumId: forum._id.toString(),
      thread: populatedThread
    });

    res.status(201).json({
      success: true,
      message: 'Thread created successfully',
      data: populatedThread
    });
  } catch (error) {
    console.error('Create Thread Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update thread (own thread only)
// @route   PUT /api/forums/:forumId/threads/:threadId
// @access  Private
const updateThread = async (req, res) => {
  try {
    const { title, content } = req.body;

    const forum = await Forum.findById(req.params.forumId);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    const thread = forum.threads.id(req.params.threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Check if user is thread author
    if (thread.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this thread'
      });
    }

    if (title) thread.title = title;
    if (content) thread.content = content;
    thread.updatedAt = Date.now();

    await forum.save();

    // ⚡ Emit real-time event
    emitForumEvent(req, 'thread-updated', {
      forumId: forum._id.toString(),
      threadId: thread._id.toString(),
      thread
    });

    res.status(200).json({
      success: true,
      message: 'Thread updated successfully',
      data: thread
    });
  } catch (error) {
    console.error('Update Thread Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete thread (own thread or instructor)
// @route   DELETE /api/forums/:forumId/threads/:threadId
// @access  Private
const deleteThread = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.forumId).populate('course');

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    const thread = forum.threads.id(req.params.threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    const isInstructor = forum.course.instructor.toString() === req.user._id.toString();
    const isAuthor = thread.author.toString() === req.user._id.toString();

    if (!isInstructor && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this thread'
      });
    }

    // Delete all replies
    await ForumReply.deleteMany({ forum: forum._id, threadId: thread._id });

    // Remove thread
    const threadId = thread._id.toString();
    thread.deleteOne();
    await forum.save();

    // ⚡ Emit real-time event
    emitForumEvent(req, 'thread-deleted', {
      forumId: forum._id.toString(),
      threadId
    });

    res.status(200).json({
      success: true,
      message: 'Thread and all replies deleted successfully'
    });
  } catch (error) {
    console.error('Delete Thread Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Pin/Unpin thread (Instructor only)
// @route   PUT /api/forums/:forumId/threads/:threadId/pin
// @access  Private/Instructor
const togglePinThread = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.forumId).populate('course');

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    // Check if user is instructor
    if (forum.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can pin threads'
      });
    }

    const thread = forum.threads.id(req.params.threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    thread.isPinned = !thread.isPinned;
    await forum.save();

    // ⚡ Emit real-time event
    emitForumEvent(req, 'thread-pinned', {
      forumId: forum._id.toString(),
      threadId: thread._id.toString(),
      isPinned: thread.isPinned
    });

    res.status(200).json({
      success: true,
      message: `Thread ${thread.isPinned ? 'pinned' : 'unpinned'} successfully`,
      data: thread
    });
  } catch (error) {
    console.error('Toggle Pin Thread Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reply to thread
// @route   POST /api/forums/:forumId/threads/:threadId/replies
// @access  Private
const replyToThread = async (req, res) => {
  try {
    const { content } = req.body;

    const forum = await Forum.findById(req.params.forumId).populate('course');

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    // Check if thread exists
    const thread = forum.threads.id(req.params.threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Check if user is enrolled or is instructor
    const isInstructor = forum.course.instructor.toString() === req.user._id.toString();
    
    if (!isInstructor) {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: forum.course._id,
        status: 'approved'
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to reply'
        });
      }
    }

    // Create reply
    const reply = await ForumReply.create({
      forum: forum._id,
      threadId: req.params.threadId,
      author: req.user._id,
      content
    });

    const populatedReply = await ForumReply.findById(reply._id)
      .populate('author', 'name role');

    // ⚡ Emit real-time event
    emitForumEvent(req, 'reply-created', {
      forumId: forum._id.toString(),
      threadId: req.params.threadId,
      reply: populatedReply
    });

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      data: populatedReply
    });
  } catch (error) {
    console.error('Reply to Thread Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update reply (own reply only)
// @route   PUT /api/forums/replies/:replyId
// @access  Private
const updateReply = async (req, res) => {
  try {
    const { content } = req.body;

    const reply = await ForumReply.findById(req.params.replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    // Check if user is reply author
    if (reply.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reply'
      });
    }

    reply.content = content;
    reply.updatedAt = Date.now();
    await reply.save();

    // ⚡ Emit real-time event
    emitForumEvent(req, 'reply-updated', {
      forumId: reply.forum.toString(),
      threadId: reply.threadId.toString(),
      replyId: reply._id.toString(),
      reply
    });

    res.status(200).json({
      success: true,
      message: 'Reply updated successfully',
      data: reply
    });
  } catch (error) {
    console.error('Update Reply Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete reply (own reply or instructor)
// @route   DELETE /api/forums/replies/:replyId
// @access  Private
const deleteReply = async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.replyId)
      .populate({
        path: 'forum',
        populate: { path: 'course' }
      });

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    const isInstructor = reply.forum.course.instructor.toString() === req.user._id.toString();
    const isAuthor = reply.author.toString() === req.user._id.toString();

    if (!isInstructor && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reply'
      });
    }

    const replyData = {
      forumId: reply.forum._id.toString(),
      threadId: reply.threadId.toString(),
      replyId: reply._id.toString()
    };

    await reply.deleteOne();

    // ⚡ Emit real-time event
    emitForumEvent(req, 'reply-deleted', replyData);

    res.status(200).json({
      success: true,
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    console.error('Delete Reply Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getForumByCourse,
  createThread,
  updateThread,
  deleteThread,
  togglePinThread,
  replyToThread,
  updateReply,
  deleteReply
};

// const Forum = require('../models/Forum');
// const ForumReply = require('../models/ForumReply');
// const Course = require('../models/Course');
// const Enrollment = require('../models/Enrollment');

// // 🔥 PERFECT HELPER - Already working fine!
// const emitForumEvent = (req, event, data) => {
//   const io = req.app.get('io');
//   console.log('🔥 EMIT CHECK:', event, 'to room:', `forum-${data.forumId}`);
  
//   if (io) {
//     io.to(`forum-${data.forumId}`).emit(event, data);
//     console.log('✅ EMITTED:', event);
//   } else {
//     console.log('❌ NO IO!');
//   }
// };

// // @desc    Get forum by course ID
// const getForumByCourse = async (req, res) => {
//   try {
//     let forum = await Forum.findOne({ course: req.params.courseId })
//       .populate('threads.author', 'name role');

//     if (!forum) {
//       forum = await Forum.create({ course: req.params.courseId });
//     }

//     const threadsWithReplies = await Promise.all(
//       forum.threads.map(async (thread) => {
//         const replies = await ForumReply.find({ 
//           forum: forum._id, 
//           threadId: thread._id 
//         })
//           .populate('author', 'name role')
//           .sort('createdAt');

//         return {
//           ...thread.toObject(),
//           replies
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       data: {
//         _id: forum._id,
//         course: forum.course,
//         threads: threadsWithReplies
//       }
//     });
//   } catch (error) {
//     console.error('Get Forum Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Create discussion thread ✅ REAL-TIME
// const createThread = async (req, res) => {
//   try {
//     const { title, content } = req.body;
//     const forum = await Forum.findById(req.params.forumId).populate('course');

//     if (!forum) {
//       return res.status(404).json({ success: false, message: 'Forum not found' });
//     }

//     const isInstructor = forum.course.instructor.toString() === req.user._id.toString();
    
//     if (!isInstructor) {
//       const enrollment = await Enrollment.findOne({
//         student: req.user._id,
//         course: forum.course._id,
//         status: 'approved'
//       });

//       if (!enrollment) {
//         return res.status(403).json({
//           success: false,
//           message: 'You must be enrolled in this course to post in the forum'
//         });
//       }
//     }

//     forum.threads.push({
//       title,
//       content,
//       author: req.user._id,
//       isPinned: false
//     });

//     await forum.save();
//     const newThread = forum.threads[forum.threads.length - 1];

//     await forum.populate('threads.author', 'name role');
//     const populatedThread = forum.threads.id(newThread._id);

//     // 🔥 REAL-TIME ✅
//     emitForumEvent(req, 'thread-created', {
//       forumId: forum._id.toString(),
//       thread: populatedThread
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Thread created successfully',
//       data: populatedThread
//     });
//   } catch (error) {
//     console.error('Create Thread Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Update thread ✅ REAL-TIME
// const updateThread = async (req, res) => {
//   try {
//     const { title, content } = req.body;
//     const forum = await Forum.findById(req.params.forumId);

//     if (!forum) {
//       return res.status(404).json({ success: false, message: 'Forum not found' });
//     }

//     const thread = forum.threads.id(req.params.threadId);
//     if (!thread) {
//       return res.status(404).json({ success: false, message: 'Thread not found' });
//     }

//     if (thread.author.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to update this thread'
//       });
//     }

//     if (title) thread.title = title;
//     if (content) thread.content = content;
//     thread.updatedAt = Date.now();
//     await forum.save();

//     // 🔥 REAL-TIME ✅
//     emitForumEvent(req, 'thread-updated', {
//       forumId: forum._id.toString(),
//       threadId: thread._id.toString(),
//       thread
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Thread updated successfully',
//       data: thread
//     });
//   } catch (error) {
//     console.error('Update Thread Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Delete thread ✅ REAL-TIME
// const deleteThread = async (req, res) => {
//   try {
//     const forum = await Forum.findById(req.params.forumId).populate('course');
//     if (!forum) {
//       return res.status(404).json({ success: false, message: 'Forum not found' });
//     }

//     const thread = forum.threads.id(req.params.threadId);
//     if (!thread) {
//       return res.status(404).json({ success: false, message: 'Thread not found' });
//     }

//     const isInstructor = forum.course.instructor.toString() === req.user._id.toString();
//     const isAuthor = thread.author.toString() === req.user._id.toString();

//     if (!isInstructor && !isAuthor) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to delete this thread'
//       });
//     }

//     await ForumReply.deleteMany({ forum: forum._id, threadId: thread._id });
//     const threadId = thread._id.toString();
//     thread.deleteOne();
//     await forum.save();

//     // 🔥 REAL-TIME ✅
//     emitForumEvent(req, 'thread-deleted', {
//       forumId: forum._id.toString(),
//       threadId
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Thread and all replies deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete Thread Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Pin/Unpin thread ✅ REAL-TIME
// const togglePinThread = async (req, res) => {
//   try {
//     const forum = await Forum.findById(req.params.forumId).populate('course');
//     if (!forum) {
//       return res.status(404).json({ success: false, message: 'Forum not found' });
//     }

//     if (forum.course.instructor.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only instructors can pin threads'
//       });
//     }

//     const thread = forum.threads.id(req.params.threadId);
//     if (!thread) {
//       return res.status(404).json({ success: false, message: 'Thread not found' });
//     }

//     thread.isPinned = !thread.isPinned;
//     await forum.save();

//     // 🔥 REAL-TIME ✅
//     emitForumEvent(req, 'thread-pinned', {
//       forumId: forum._id.toString(),
//       threadId: thread._id.toString(),
//       isPinned: thread.isPinned
//     });

//     res.status(200).json({
//       success: true,
//       message: `Thread ${thread.isPinned ? 'pinned' : 'unpinned'} successfully`,
//       data: thread
//     });
//   } catch (error) {
//     console.error('Toggle Pin Thread Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Reply to thread ✅ REAL-TIME
// const replyToThread = async (req, res) => {
//   try {
//     const { content } = req.body;
//     const forum = await Forum.findById(req.params.forumId).populate('course');
//     if (!forum) {
//       return res.status(404).json({ success: false, message: 'Forum not found' });
//     }

//     const thread = forum.threads.id(req.params.threadId);
//     if (!thread) {
//       return res.status(404).json({ success: false, message: 'Thread not found' });
//     }

//     const isInstructor = forum.course.instructor.toString() === req.user._id.toString();
//     if (!isInstructor) {
//       const enrollment = await Enrollment.findOne({
//         student: req.user._id,
//         course: forum.course._id,
//         status: 'approved'
//       });
//       if (!enrollment) {
//         return res.status(403).json({
//           success: false,
//           message: 'You must be enrolled in this course to reply'
//         });
//       }
//     }

//     const reply = await ForumReply.create({
//       forum: forum._id,
//       threadId: req.params.threadId,
//       author: req.user._id,
//       content
//     });

//     const populatedReply = await ForumReply.findById(reply._id)
//       .populate('author', 'name role');

//     // 🔥 REAL-TIME ✅
//     emitForumEvent(req, 'reply-created', {
//       forumId: forum._id.toString(),
//       threadId: req.params.threadId,
//       reply: populatedReply
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Reply posted successfully',
//       data: populatedReply
//     });
//   } catch (error) {
//     console.error('Reply to Thread Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Update reply ✅ REAL-TIME
// const updateReply = async (req, res) => {
//   try {
//     const { content } = req.body;
//     const reply = await ForumReply.findById(req.params.replyId);

//     if (!reply) {
//       return res.status(404).json({ success: false, message: 'Reply not found' });
//     }

//     if (reply.author.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to update this reply'
//       });
//     }

//     reply.content = content;
//     reply.updatedAt = Date.now();
//     await reply.save();

//     // 🔥 REAL-TIME ✅
//     emitForumEvent(req, 'reply-updated', {
//       forumId: reply.forum.toString(),
//       threadId: reply.threadId.toString(),
//       replyId: reply._id.toString(),
//       reply
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Reply updated successfully',
//       data: reply
//     });
//   } catch (error) {
//     console.error('Update Reply Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Delete reply ✅ REAL-TIME
// const deleteReply = async (req, res) => {
//   try {
//     const reply = await ForumReply.findById(req.params.replyId)
//       .populate({
//         path: 'forum',
//         populate: { path: 'course' }
//       });

//     if (!reply) {
//       return res.status(404).json({ success: false, message: 'Reply not found' });
//     }

//     const isInstructor = reply.forum.course.instructor.toString() === req.user._id.toString();
//     const isAuthor = reply.author.toString() === req.user._id.toString();

//     if (!isInstructor && !isAuthor) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to delete this reply'
//       });
//     }

//     const replyData = {
//       forumId: reply.forum._id.toString(),
//       threadId: reply.threadId.toString(),
//       replyId: reply._id.toString()
//     };

//     await reply.deleteOne();

//     // 🔥 REAL-TIME ✅
//     emitForumEvent(req, 'reply-deleted', replyData);

//     res.status(200).json({
//       success: true,
//       message: 'Reply deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete Reply Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   getForumByCourse,
//   createThread,
//   updateThread,
//   deleteThread,
//   togglePinThread,
//   replyToThread,
//   updateReply,
//   deleteReply
// };
