import axiosInstance from './axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ========================
// AUTHENTICATION
// ========================
export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  getProfile: () => axiosInstance.get('/auth/me'),
  updateProfile: (data) => axiosInstance.put('/auth/profile', data),
};

// ========================
// COURSES
// ========================
export const courseAPI = {
  getAll: (params) => axiosInstance.get('/courses', { params }),
  getById: (id) => axiosInstance.get(`/courses/${id}`),
  getMyCourses: () => axiosInstance.get('/courses/my-courses'),
  create: (data) => axiosInstance.post('/courses', data),
  update: (id, data) => axiosInstance.put(`/courses/${id}`, data),
  delete: (id) => axiosInstance.delete(`/courses/${id}`),
};

// ========================
// MODULES
// ========================
export const moduleAPI = {
  getByCourse: (courseId) => axiosInstance.get(`/modules/course/${courseId}`),
  create: (data) => axiosInstance.post('/modules', data),
  update: (id, data) => axiosInstance.put(`/modules/${id}`, data),
  delete: (id) => axiosInstance.delete(`/modules/${id}`),
};

// ========================
// LESSONS
// ========================
export const lessonAPI = {
  getByModule: (moduleId) => axiosInstance.get(`/lessons/module/${moduleId}`),
  getById: (id) => axiosInstance.get(`/lessons/${id}`),
  create: (formData) => axiosInstance.post('/lessons', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => axiosInstance.put(`/lessons/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => axiosInstance.delete(`/lessons/${id}`),
};

// ========================
// QUIZZES
// ========================
export const quizAPI = {
  getByCourse: (courseId) => axiosInstance.get(`/quizzes/course/${courseId}`),
  getById: (id) => axiosInstance.get(`/quizzes/${id}`),
  create: (data) => axiosInstance.post('/quizzes', data),
  update: (id, data) => axiosInstance.put(`/quizzes/${id}`, data),
  delete: (id) => axiosInstance.delete(`/quizzes/${id}`),
  addQuestion: (quizId, data) => axiosInstance.post(`/quizzes/${quizId}/questions`, data),
  updateQuestion: (questionId, data) => axiosInstance.put(`/quizzes/questions/${questionId}`, data),
  deleteQuestion: (questionId) => axiosInstance.delete(`/quizzes/questions/${questionId}`),
  submit: (quizId, data) => axiosInstance.post(`/quizzes/${quizId}/submit`, data),
};

// ========================
// ASSIGNMENTS
// ========================
export const assignmentAPI = {
  getByCourse: (courseId) => axiosInstance.get(`/assignments/course/${courseId}`),
  getById: (id) => axiosInstance.get(`/assignments/${id}`),
  create: (data) => axiosInstance.post('/assignments', data),
  update: (id, data) => axiosInstance.put(`/assignments/${id}`, data),
  delete: (id) => axiosInstance.delete(`/assignments/${id}`),
  submit: (id, formData) => axiosInstance.post(`/assignments/${id}/submit`, formData),
  //   {
  //   headers: { 'Content-Type': 'multipart/form-data' }
  // }),
  getSubmissions: (id) => axiosInstance.get(`/assignments/${id}/submissions`),
  gradeSubmission: (submissionId, data) => axiosInstance.put(`/assignments/submissions/${submissionId}/grade`, data),
  getMySubmissions: () => axiosInstance.get('/assignments/my-submissions'),
};

// ========================
// ENROLLMENTS
// ========================
export const enrollmentAPI = {
  request: (data) => axiosInstance.post('/enrollments/request', data),
  getRequests: () => axiosInstance.get('/enrollments/requests'),
  updateStatus: (id, data) => axiosInstance.put(`/enrollments/${id}/status`, data),
  getMyCourses: () => axiosInstance.get('/enrollments/my-courses'),
  getDetails: (id) => axiosInstance.get(`/enrollments/${id}`),
  updateProgress: (id) => axiosInstance.put(`/enrollments/${id}/progress`),
  rateCourse: (id, data) => axiosInstance.put(`/enrollments/${id}/review`, data),
  remove: (id) => axiosInstance.delete(`/enrollments/${id}`),
};

// ========================
// FORUM
// ========================
export const forumAPI = {
  getByCourse: (courseId) => axiosInstance.get(`/forums/course/${courseId}`),
  createThread: (forumId, data) => axiosInstance.post(`/forums/${forumId}/threads`, data),
  updateThread: (forumId, threadId, data) => axiosInstance.put(`/forums/${forumId}/threads/${threadId}`, data),
  deleteThread: (forumId, threadId) => axiosInstance.delete(`/forums/${forumId}/threads/${threadId}`),
  togglePin: (forumId, threadId) => axiosInstance.put(`/forums/${forumId}/threads/${threadId}/pin`),
  replyToThread: (forumId, threadId, data) => axiosInstance.post(`/forums/${forumId}/threads/${threadId}/replies`, data),
  updateReply: (replyId, data) => axiosInstance.put(`/forums/replies/${replyId}`, data),
  deleteReply: (replyId) => axiosInstance.delete(`/forums/replies/${replyId}`),
};

// ========================
// CERTIFICATES
// ========================
export const certificateAPI = {
  getMyCertificates: () => axiosInstance.get('/certificates/my-certificates'),
  getById: (id) => axiosInstance.get(`/certificates/${id}`),
  verify: (certificateId) => axiosInstance.get(`/certificates/verify/${certificateId}`),
  // download: (id) => axiosInstance.get(`/certificates/${id}/download`),
  download: (id) => axiosInstance.get(`/certificates/${id}/download`, { responseType: 'blob' }),
};

// ========================
// VIDEO PROGRESS
// ========================
export const progressAPI = {
  updateVideo: (data) => axiosInstance.post('/progress/video', data),
  getVideoProgress: (lessonId) => axiosInstance.get(`/progress/video/${lessonId}`),
  getCourseProgress: (courseId) => axiosInstance.get(`/progress/course/${courseId}`),
};

// ========================
// HELPER: Get file URL
// ========================
export const getFileURL = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5001${path}`;
};
