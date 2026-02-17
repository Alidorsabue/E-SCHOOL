import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types'
import api from '@/services/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => void
  setUser: (user: User) => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (username: string, password: string): Promise<User> => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login/', { username, password })
          const { access, refresh } = response.data
          
          localStorage.setItem('access_token', access)
          localStorage.setItem('refresh_token', refresh)
          
          // Get user profile
          const userResponse = await api.get('/auth/users/me/')
          const user = userResponse.data
          
          if (user?.school?.code) {
            localStorage.setItem('school_code', user.school.code)
          }
          
          set({ user, isAuthenticated: true, isLoading: false })
          return user
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
      
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        localStorage.removeItem('school_code')
        set({ user: null, isAuthenticated: false })
      },
      
      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },
      
      checkAuth: async () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
          set({ user: null, isAuthenticated: false })
          return
        }
        
        try {
          const response = await api.get('/auth/users/me/')
          set({ user: response.data, isAuthenticated: true })
        } catch (error: any) {
          // Si l'erreur est 401, c'est normal (token expiré ou invalide)
          // Ne pas afficher de notification pour cette erreur
          if (error?.response?.status === 401) {
            // Nettoyer le localStorage en cas d'erreur 401
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user')
            localStorage.removeItem('school_code')
          }
          set({ user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
