import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      <Header user={user} onLogout={handleLogout} />
      <div className="flex flex-1">
        <Sidebar user={user} currentPath={location.pathname} />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
