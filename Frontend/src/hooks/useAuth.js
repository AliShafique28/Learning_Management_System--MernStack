import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/endpoints';
import useAuthStore from '../store/authStore';
import { handleAPIError, showSuccess } from '../utils/errorHandler';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth, logout: storeLogout, hasRole } = useAuthStore();

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { data } = response.data;
      
      setAuth(data, data.token);
      showSuccess('Login successful!');
      
      // Redirect based on role
      if (data.role === 'instructor') {
        navigate('/instructor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
      
      return { success: true };
    } catch (error) {
      handleAPIError(error);
      return { success: false, error };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { data } = response.data;
      
      setAuth(data, data.token);
      showSuccess('Registration successful!');
      
      // Redirect based on role
      if (data.role === 'instructor') {
        navigate('/instructor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
      
      return { success: true };
    } catch (error) {
      handleAPIError(error);
      return { success: false, error };
    }
  };

  const logout = () => {
    storeLogout();
    showSuccess('Logged out successfully');
    navigate('/login');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const { data } = response.data;
      
      useAuthStore.getState().updateUser(data);
      showSuccess('Profile updated successfully!');
      
      return { success: true, data };
    } catch (error) {
      handleAPIError(error);
      return { success: false, error };
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
  };
};
