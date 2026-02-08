import { toast } from 'react-toastify';

/**
 * Handle API errors with user-friendly messages
 */
export const handleAPIError = (error, customMessage = null) => {
  console.error('API Error:', error);

  if (customMessage) {
    toast.error(customMessage);
    return;
  }

  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        toast.error(data.message || 'Invalid request. Please check your input.');
        break;
      case 401:
        toast.error('You are not authenticated. Please login.');
        break;
      case 403:
        toast.error(data.message || 'You do not have permission to perform this action.');
        break;
      case 404:
        toast.error(data.message || 'The requested resource was not found.');
        break;
      case 409:
        toast.error(data.message || 'This resource already exists.');
        break;
      case 422:
        toast.error(data.message || 'Validation failed. Please check your input.');
        break;
      case 500:
        toast.error('Internal server error. Please try again later.');
        break;
      default:
        toast.error(data.message || 'An unexpected error occurred.');
    }
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error. Please check your internet connection.');
  } else {
    // Something else happened
    toast.error('An unexpected error occurred. Please try again.');
  }
};

/**
 * Validate form data
 */
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = data[field];

    // Required check
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${rule.label || field} is required`;
      return;
    }

    // Min length check
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
      return;
    }

    // Max length check
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must not exceed ${rule.maxLength} characters`;
      return;
    }

    // Email validation
    if (rule.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field] = 'Please enter a valid email address';
      }
    }

    // Custom validation
    if (rule.validate && value) {
      const customError = rule.validate(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Show success message
 */
export const showSuccess = (message) => {
  toast.success(message);
};

/**
 * Show error message
 */
export const showError = (message) => {
  toast.error(message);
};

/**
 * Show warning message
 */
export const showWarning = (message) => {
  toast.warning(message);
};

/**
 * Show info message
 */
export const showInfo = (message) => {
  toast.info(message);
};
