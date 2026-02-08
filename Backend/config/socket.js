// // Socket.io connection and event handlers

// const setupSocket = (io) => {
//   io.on('connection', (socket) => {
//     console.log('✅ New client connected:', socket.id);

//     // Join course forum room
//     socket.on('join-forum', (forumId) => {
//       socket.join(`forum-${forumId}`);
//       console.log(`User ${socket.id} joined forum-${forumId}`);
      
//       // Notify others in the room
//       socket.to(`forum-${forumId}`).emit('user-joined', {
//         message: 'A user joined the discussion'
//       });
//     });

//     // Leave course forum room
//     socket.on('leave-forum', (forumId) => {
//       socket.leave(`forum-${forumId}`);
//       console.log(`User ${socket.id} left forum-${forumId}`);
      
//       // Notify others in the room
//       socket.to(`forum-${forumId}`).emit('user-left', {
//         message: 'A user left the discussion'
//       });
//     });

//     // Handle typing indicator (optional feature)
//     socket.on('typing', (data) => {
//       socket.to(`forum-${data.forumId}`).emit('user-typing', {
//         threadId: data.threadId,
//         userName: data.userName
//       });
//     });

//     // Handle stop typing
//     socket.on('stop-typing', (data) => {
//       socket.to(`forum-${data.forumId}`).emit('user-stop-typing', {
//         threadId: data.threadId
//       });
//     });

//     // Handle disconnect
//     socket.on('disconnect', () => {
//       console.log('❌ Client disconnected:', socket.id);
//     });
//   });
// };

// module.exports = setupSocket;


// Socket.io connection and event handlers
const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ New client connected:', socket.id);

    // Join course forum room
    socket.on('join-forum', (forumId) => {
      socket.join(`forum-${forumId}`);
      console.log(`📡 User ${socket.id} joined forum-${forumId}`);
      
      // Notify others in the room
      socket.to(`forum-${forumId}`).emit('user-joined', {
        message: 'A user joined the discussion'
      });
    });

    // Leave course forum room
    socket.on('leave-forum', (forumId) => {
      socket.leave(`forum-${forumId}`);
      console.log(`👋 User ${socket.id} left forum-${forumId}`);
      
      // Notify others in the room
      socket.to(`forum-${forumId}`).emit('user-left', {
        message: 'A user left the discussion'
      });
    });

    // 🔥 FORUM REAL-TIME EVENTS (NEW)
    socket.on('thread-created', (data) => {
      console.log('📨 Broadcasting thread-created to forum-', data.forumId);
      io.to(`forum-${data.forumId}`).emit('thread-created', data);
    });

    socket.on('thread-updated', (data) => {
      console.log('📨 Broadcasting thread-updated to forum-', data.forumId);
      io.to(`forum-${data.forumId}`).emit('thread-updated', data);
    });

    socket.on('thread-deleted', (data) => {
      console.log('📨 Broadcasting thread-deleted to forum-', data.forumId);
      io.to(`forum-${data.forumId}`).emit('thread-deleted', data);
    });

    socket.on('thread-pinned', (data) => {
      console.log('📨 Broadcasting thread-pinned to forum-', data.forumId);
      io.to(`forum-${data.forumId}`).emit('thread-pinned', data);
    });

    socket.on('reply-created', (data) => {
      console.log('📨 Broadcasting reply-created to forum-', data.forumId);
      io.to(`forum-${data.forumId}`).emit('reply-created', data);
    });

    socket.on('reply-updated', (data) => {
      console.log('📨 Broadcasting reply-updated to forum-', data.forumId);
      io.to(`forum-${data.forumId}`).emit('reply-updated', data);
    });

    socket.on('reply-deleted', (data) => {
      console.log('📨 Broadcasting reply-deleted to forum-', data.forumId);
      io.to(`forum-${data.forumId}`).emit('reply-deleted', data);
    });

    // Handle typing indicator (optional feature)
    socket.on('typing', (data) => {
      socket.to(`forum-${data.forumId}`).emit('user-typing', {
        threadId: data.threadId,
        userName: data.userName
      });
    });

    // Handle stop typing
    socket.on('stop-typing', (data) => {
      socket.to(`forum-${data.forumId}`).emit('user-stop-typing', {
        threadId: data.threadId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });
};

module.exports = setupSocket;

