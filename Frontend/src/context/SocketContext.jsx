import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            // Create socket connection
            const newSocket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket connected:', newSocket.id);
                setConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
                setConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setConnected(false);
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                newSocket.close();
            };
        } else {
            // Disconnect socket if not authenticated
            if (socket) {
                socket.close();
                setSocket(null);
                setConnected(false);
            }
        }
    }, [isAuthenticated]);

    const joinForum = (forumId) => {
        if (socket && connected) {
            socket.emit('join-forum', forumId);
            console.log('Joined forum:', forumId);
        }
    };

    const leaveForum = (forumId) => {
        if (socket && connected) {
            socket.emit('leave-forum', forumId);
            console.log('Left forum:', forumId);
        }
    };

    const value = {
        socket,
        connected,
        joinForum,
        leaveForum,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

// src/context/SocketContext.jsx - Updated PERFECT code
// import { createContext, useContext, useEffect, useState, useRef } from 'react';
// import { io } from 'socket.io-client';
// import useAuthStore from '../store/authStore';

// const SocketContext = createContext(null);

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

// export const SocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);
//   const [connected, setConnected] = useState(false);
//   const socketRef = useRef(null); // 🔥 Prevent multiple connections
//   const { isAuthenticated, token } = useAuthStore();

//   useEffect(() => {
//     // Cleanup previous socket
//     if (socketRef.current) {
//       socketRef.current.disconnect();
//     }

//     if (isAuthenticated && token) {
//       // 🔥 PERFECT SOCKET CONFIG
//       const newSocket = io(SOCKET_URL, {
//         auth: {
//           token: token  // 🔥 Pass token for auth
//         },
//         transports: ['websocket', 'polling'],  // 🔥 Fallback polling
//         reconnection: true,
//         reconnectionAttempts: 5,
//         reconnectionDelay: 1000,
//         timeout: 20000,
//         forceNew: true
//       });

//       socketRef.current = newSocket;

//       newSocket.on('connect', () => {
//         console.log('✅ Socket connected:', newSocket.id);
//         setConnected(true);
//         setSocket(newSocket);
//       });

//       newSocket.on('disconnect', (reason) => {
//         console.log('❌ Socket disconnected:', reason);
//         setConnected(false);
//       });

//       newSocket.on('connect_error', (error) => {
//         console.log('🔌 Socket error (will retry):', error.message);
//         // Don't setConnected(false) - let it retry
//       });

//       // Cleanup
//       return () => {
//         newSocket.disconnect();
//       };
//     } else {
//       setSocket(null);
//       setConnected(false);
//     }
//   }, [isAuthenticated, token]);

//   const joinForum = (forumId) => {
//     // 🔥 FIX: Correct room name
//   socket?.emit('join-room', `forum-${forumId}`);
//   console.log('📡 Joined room: forum-', forumId);
//   };

//   const leaveForum = (forumId) => {
//     socket?.emit('leave-room', `forum-${forumId}`);
//   };

//   const value = {
//     socket,
//     connected,
//     joinForum,
//     leaveForum,
//   };

//   return (
//     <SocketContext.Provider value={value}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocket = () => {
//   const context = useContext(SocketContext);
//   if (!context) {
//     throw new Error('useSocket must be used within SocketProvider');
//   }
//   return context;
// };
