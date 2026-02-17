import { Bell } from 'lucide-react'
import { User as UserType } from '@/types'
import logoImage from '@/images/logo.png'
import UserMenu from '@/components/user/UserMenu'

interface HeaderProps {
  user: UserType
  onLogout: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur',
    TEACHER: 'Enseignant',
    PARENT: 'Parent',
    STUDENT: 'Élève',
  }

  // Nom de l'école ou fallback
  const schoolName = user.school?.name || 'École'
  
  // Logo de l'école - vérifier que c'est une URL valide
  const schoolLogoValue = user.school?.logo
  const hasSchoolLogo = schoolLogoValue && 
                        typeof schoolLogoValue === 'string' && 
                        schoolLogoValue.trim() !== '' &&
                        (schoolLogoValue.startsWith('http') || schoolLogoValue.startsWith('/'))
  
  const schoolLogo = hasSchoolLogo ? schoolLogoValue : null

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo E-School (logo par défaut) - Agrandi */}
          <img 
            src={logoImage} 
            alt="E-School" 
            className="h-16 w-auto"
          />
          {/* Nom et logo de l'école */}
          {user.school && (
            <div className="flex items-center space-x-3 border-l border-gray-300 dark:border-gray-600 pl-4">
              {schoolLogo ? (
                <img 
                  src={schoolLogo} 
                  alt={schoolName}
                  className="h-12 w-auto max-w-[180px] object-contain"
                  onError={(e) => {
                    // Remplacer par le placeholder si le logo ne charge pas
                    const target = e.currentTarget
                    target.style.display = 'none'
                    // Afficher le placeholder à la place
                    const placeholder = target.nextElementSibling as HTMLElement
                    if (placeholder) {
                      placeholder.style.display = 'flex'
                    }
                  }}
                />
              ) : null}
              <div 
                className={`h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md ${schoolLogo ? 'hidden' : ''}`}
              >
                <span className="text-white font-bold text-lg">
                  {schoolName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider leading-tight ">
                {schoolName}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white relative transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[user.role]}</p>
            </div>
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  )
}
