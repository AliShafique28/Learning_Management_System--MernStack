import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Loader from '../common/Loader';
import { useEffect, useState } from 'react';
import { authAPI } from '../../api/endpoints';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify token is still valid
        const response = await authAPI.getProfile();
        setAuth(response.data.data, token);
      } catch (error) {
        console.error('Auth verification failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (loading) {
    return <Loader fullScreen text="Verifying authentication..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
