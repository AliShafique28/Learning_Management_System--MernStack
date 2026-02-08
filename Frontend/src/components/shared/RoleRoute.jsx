import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user && !allowedRoles.includes(user.role)) {
      toast.error('You do not have permission to access this page');
    }
  }, [isAuthenticated, user, allowedRoles]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user?.role === 'instructor' 
      ? '/instructor/dashboard' 
      : '/student/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleRoute;
