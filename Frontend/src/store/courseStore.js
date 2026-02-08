import { create } from 'zustand';

const useCourseStore = create((set) => ({
  courses: [],
  currentCourse: null,
  loading: false,
  error: null,

  // Set courses
  setCourses: (courses) => set({ courses }),

  // Set current course
  setCurrentCourse: (course) => set({ currentCourse: course }),

  // Add course
  addCourse: (course) => set((state) => ({
    courses: [course, ...state.courses]
  })),

  // Update course
  updateCourse: (id, updatedData) => set((state) => ({
    courses: state.courses.map((course) =>
      course._id === id ? { ...course, ...updatedData } : course
    ),
    currentCourse: state.currentCourse?._id === id
      ? { ...state.currentCourse, ...updatedData }
      : state.currentCourse
  })),

  // Delete course
  deleteCourse: (id) => set((state) => ({
    courses: state.courses.filter((course) => course._id !== id),
    currentCourse: state.currentCourse?._id === id ? null : state.currentCourse
  })),

  // Set loading
  setLoading: (loading) => set({ loading }),

  // Set error
  setError: (error) => set({ error }),

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useCourseStore;
