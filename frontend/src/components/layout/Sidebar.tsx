import { NavLink } from 'react-router-dom'
import { User } from '@/types'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap,
  CreditCard,
  BarChart3,
  FileText,
  Calendar,
  MessageSquare,
  Library,
  Home,
  UserCheck,
  AlertCircle,
  Wallet
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface SidebarProps {
  user: User
  currentPath: string
}

const adminMenu = [
  { path: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/admin/enrollments', label: 'Inscriptions', icon: Users },
  { path: '/admin/students', label: 'Élèves', icon: Users },
  { path: '/admin/classes', label: 'Classes', icon: GraduationCap },
  { path: '/admin/former-students', label: 'Anciens élèves', icon: GraduationCap },
  { path: '/admin/teachers', label: 'Enseignants', icon: Users },
  { path: '/admin/payments', label: 'Paiements', icon: CreditCard },
  { path: '/admin/expenses', label: 'Dépenses', icon: BarChart3 },
  { path: '/admin/caisse', label: 'Caisse', icon: Wallet },
  { path: '/admin/meetings', label: 'Réunions', icon: Calendar },
  { path: '/admin/library', label: 'Bibliothèque', icon: Library },
  { path: '/admin/elearning', label: 'E-learning', icon: BookOpen },
  { path: '/admin/tutoring', label: 'Encadrement', icon: MessageSquare },
  { path: '/admin/discipline', label: 'Fiches de discipline', icon: AlertCircle },
  { path: '/admin/statistics', label: 'Statistiques', icon: BarChart3 },
]

const teacherMenu = [
  { path: '/teacher', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/teacher/students', label: 'Élèves', icon: Users },
  { path: '/teacher/my-class', label: 'Ma classe', icon: UserCheck },
  { path: '/teacher/classes', label: 'Classes', icon: GraduationCap },
  { path: '/teacher/class-subjects', label: 'Matières par classe', icon: BookOpen },
  { path: '/teacher/grades', label: 'Notes', icon: FileText },
  { path: '/teacher/attendance', label: 'Présences', icon: Users },
  { path: '/teacher/assignments', label: 'Devoirs', icon: BookOpen },
  { path: '/teacher/quizzes', label: 'Interrogations & Examens', icon: GraduationCap },
  { path: '/teacher/courses', label: 'Cours', icon: BookOpen },
  { path: '/teacher/elearning', label: 'E-learning', icon: BookOpen },
  { path: '/teacher/library', label: 'Bibliothèque', icon: Library },
  { path: '/teacher/meetings', label: 'Réunions', icon: Calendar },
  { path: '/teacher/discipline', label: 'Fiches de discipline', icon: AlertCircle },
  { path: '/teacher/tutoring', label: 'Encadrement', icon: MessageSquare },
]

const parentMenu = [
  { path: '/parent', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/parent/grades', label: 'Notes', icon: FileText },
  { path: '/parent/meetings', label: 'Réunions', icon: Calendar },
  { path: '/parent/payments', label: 'Paiements', icon: CreditCard },
  { path: '/parent/library', label: 'Bibliothèque', icon: Library },
  { path: '/parent/tutoring', label: 'Encadrement', icon: Home },
  { path: '/parent/discipline', label: 'Fiches de discipline', icon: AlertCircle },
  { path: '/parent/communication', label: 'Communication', icon: MessageSquare },
]

const studentMenu = [
  { path: '/student', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/student/courses', label: 'Cours', icon: BookOpen },
  { path: '/student/assignments', label: 'Devoirs', icon: FileText },
  { path: '/student/exams', label: 'Examens', icon: GraduationCap },
  { path: '/student/library', label: 'Bibliothèque', icon: Library },
  { path: '/student/grades', label: 'Notes', icon: FileText },
  { path: '/student/discipline', label: 'Fiches de discipline', icon: AlertCircle },
  { path: '/student/communication', label: 'Communication', icon: MessageSquare },
]

const accountantMenu = [
  { path: '/accountant', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/accountant/enrollments', label: 'Inscriptions', icon: Users },
  { path: '/accountant/payments', label: 'Paiements', icon: CreditCard },
  { path: '/accountant/expenses', label: 'Dépenses', icon: BarChart3 },
  { path: '/accountant/caisse', label: 'Caisse', icon: Wallet },
]

const disciplineOfficerMenu = [
  { path: '/discipline-officer', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/discipline-officer/discipline', label: 'Fiches de discipline', icon: AlertCircle },
  { path: '/discipline-officer/meetings', label: 'Réunions', icon: Calendar },
  { path: '/discipline-officer/communication', label: 'Communication', icon: MessageSquare },
]

export default function Sidebar({ user, currentPath }: SidebarProps) {
  const getMenu = () => {
    switch (user.role) {
      case 'ADMIN':
        return adminMenu
      case 'TEACHER':
        return teacherMenu
      case 'PARENT':
        return parentMenu
      case 'STUDENT':
        return studentMenu
      case 'ACCOUNTANT':
        return accountantMenu
      case 'DISCIPLINE_OFFICER':
        return disciplineOfficerMenu
      default:
        return []
    }
  }

  const menu = getMenu()

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-73px)] transition-colors">
      <nav className="p-4 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
