// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Sidebar from './components/common/Sidebar';

// Route Guards
import ProtectedRoute from './components/shared/ProtectedRoute';
import RoleRoute from './components/shared/RoleRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import MyCourses from './pages/instructor/MyCourses';
import CreateCourse from './pages/instructor/CreateCourse';
import EditCourse from './pages/instructor/EditCourse';
import ManageCourse from './pages/instructor/ManageCourse';
import Grading from './pages/instructor/Grading';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import BrowseCourses from './pages/student/BrowseCourses';
import MyCoursesStudent from './pages/student/MyCourses';
import CourseView from './pages/student/CourseView';
import LessonView from './pages/student/LessonView';
import StudentQuizzes from './pages/student/StudentQuizzes';/////////////////////////
import AssignmentsPage from './pages/student/AssignmentsPage';/////////////////////////
import TakeQuiz from './pages/student/TakeQuiz';
import MyCertificates from './pages/student/MyCertificates';

// Shared Pages
import CourseDetails from './pages/shared/CourseDetails';
import Forum from './pages/shared/Forum';
import Profile from './pages/shared/Profile';

function App() {
  // const { initialize, isAuthenticated } = useAuthStore();

  // useEffect(() => {
  //   // Initialize auth state from localStorage
  //   initialize();
  // }, [initialize]);
  const { initialize, isInitialized, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // 🔥 Initialize ONLY ONCE on app mount
    initialize();
  }, []); // Empty dependency array = runs only once!

  // Show loading until initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
        />

        {/* Root Redirect */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate
                to={
                  useAuthStore.getState().user?.role === 'instructor'
                    ? '/instructor/dashboard'
                    : '/student/dashboard'
                }
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Instructor Routes with Sidebar Layout */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['instructor']}>
                <DashboardLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path="edit-course/:id" element={<EditCourse />} />
          <Route path="manage-course/:id" element={<ManageCourse />} />
          <Route path="grading" element={<Grading />} />
        </Route>

        {/* Student Routes with Sidebar Layout */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="browse-courses" element={<BrowseCourses />} />
          <Route path="my-courses" element={<MyCoursesStudent />} />
          <Route path="course/:id" element={<CourseView />} />
          <Route path="quizzes" element={<StudentQuizzes />} />{/* ///////////////////// */}
          <Route path="assignments" element={<AssignmentsPage />} />{/* ///////////////////// */}
          <Route path="lesson/:id" element={<LessonView />} />
          <Route path="quiz/:id" element={<TakeQuiz />} />
          <Route path="certificates" element={<MyCertificates />} />
        </Route>

        {/* Shared Protected Routes */}
        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forum/:courseId"
          element={
            <ProtectedRoute>
              <Forum />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </div>
  );
}

// Dashboard Layout with Sidebar - Uses <Outlet /> for nested routes
const DashboardLayout = () => {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 bg-gray-50">
        {/* Outlet renders the nested route components */}
        <Outlet />
      </main>
    </div>
  );
};

// 404 Page
const NotFound = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <a href="/" className="btn-primary">
          Go to Homepage
        </a>
      </div>
    </div>
  );
};

export default App;

