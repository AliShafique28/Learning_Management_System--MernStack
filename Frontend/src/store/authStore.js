import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false, // 🔥 NEW: Prevent double init

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, isInitialized: true });
      },

      updateUser: (userData) => {
        set((state) => {
          const updatedUser = { ...state.user, ...userData };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return { user: updatedUser };
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
      },

      hasRole: (role) => {
        const state = get();
        return state.user?.role === role;
      },

      // 🔥 PERFECT INITIALIZE - No infinite loop!
      initialize: () => {
        const state = get();
        
        // Already initialized? Skip!
        if (state.isInitialized) {
          console.log('Auth already initialized');
          return;
        }

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          try {
            // Token expiry check
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp * 1000 < Date.now()) {
              console.log('Token expired, auto-logout');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
              return;
            }

            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true, isInitialized: true });
            console.log('Auth initialized successfully');
          } catch (error) {
            console.error('Invalid token/user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
          }
        } else {
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage), // 🔥 Better than getStorage
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }), // 🔥 Only persist these fields
      // Skip isInitialized from persistence
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        // Don't restore isInitialized from storage
        return { ...parsed, isInitialized: false };
      },
    }
  )
);

export default useAuthStore;


