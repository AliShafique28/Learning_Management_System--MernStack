const express = require('express');
const router = express.Router();
const {
  getForumByCourse,
  createThread,
  updateThread,
  deleteThread,
  togglePinThread,
  replyToThread,
  updateReply,
  deleteReply
} = require('../controllers/forumController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Forum routes
// @route   GET /api/forums/course/:courseId
// @desc    Get forum by course ID
// @access  Private
router.get('/course/:courseId', protect, getForumByCourse);

// Thread routes
// @route   POST /api/forums/:forumId/threads
// @desc    Create discussion thread
// @access  Private
router.post('/:forumId/threads', protect, createThread);

// @route   PUT /api/forums/:forumId/threads/:threadId
// @desc    Update thread (own thread only)
// @access  Private
router.put('/:forumId/threads/:threadId', protect, updateThread);

// @route   DELETE /api/forums/:forumId/threads/:threadId
// @desc    Delete thread (own thread or instructor)
// @access  Private
router.delete('/:forumId/threads/:threadId', protect, deleteThread);

// @route   PUT /api/forums/:forumId/threads/:threadId/pin
// @desc    Pin/Unpin thread (Instructor only)
// @access  Private/Instructor
router.put('/:forumId/threads/:threadId/pin', protect, roleCheck('instructor'), togglePinThread);

// Reply routes
// @route   POST /api/forums/:forumId/threads/:threadId/replies
// @desc    Reply to thread
// @access  Private
router.post('/:forumId/threads/:threadId/replies', protect, replyToThread);

// @route   PUT /api/forums/replies/:replyId
// @desc    Update reply (own reply only)
// @access  Private
router.put('/replies/:replyId', protect, updateReply);

// @route   DELETE /api/forums/replies/:replyId
// @desc    Delete reply (own reply or instructor)
// @access  Private
router.delete('/replies/:replyId', protect, deleteReply);

module.exports = router;
