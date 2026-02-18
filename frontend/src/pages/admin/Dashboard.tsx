import { useQuery } from '@tanstack/react-query'
import { Users, GraduationCap, CreditCard, TrendingUp, BarChart3, BookOpen, Library } from 'lucide-react'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        const [
          studentsRes, 
          teachersRes, 
          paymentsRes, 
          enrollmentsRes,
          attendanceRes,
          gradesRes,
          classesRes,
          booksRes
        ] = await Promise.all([
          api.get('/auth/students/').catch(() => ({ data: { results: [], count: 0 } })),
          api.get('/auth/teachers/').catch(() => ({ data: { results: [], count: 0 } })),
          api.get('/payments/payments/?status=COMPLETED').catch(() => ({ data: { results: [], count: 0 } })),
          api.get('/enrollment/applications/').catch(() => ({ data: { results: [], count: 0 } })),
          api.get('/academics/attendance/').catch(() => ({ data: { results: [] } })),
          api.get('/academics/grades/').catch(() => ({ data: { results: [] } })),
          api.get('/schools/classes/').catch(() => ({ data: { results: [] } })),
          api.get('/library/books/?is_published=true').catch(() => ({ data: { results: [] } })),
        ])
        
        // Calculer les statistiques
        const students = studentsRes.data.count || (studentsRes.data.results?.length || 0)
        const teachers = teachersRes.data.count || (teachersRes.data.results?.length || 0)
        const payments = paymentsRes.data.count || (paymentsRes.data.results?.length || 0)
        const enrollments = enrollmentsRes.data.count || (enrollmentsRes.data.results?.length || 0)
        
        // Calculer le taux de présence
        const attendanceRecords = attendanceRes.data.results || attendanceRes.data || []
        const totalAttendance = attendanceRecords.length
        const presentCount = attendanceRecords.filter((a: any) => a.status === 'PRESENT').length
        const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 0
        
        // Calculer la moyenne générale
        const grades = gradesRes.data.results || gradesRes.data || []
        const totalGrades = grades.length
        const sumGrades = grades.reduce((sum: number, g: any) => sum + (g.total_score || 0), 0)
        const averageGrade = totalGrades > 0 ? (sumGrades / totalGrades).toFixed(1) : 0
        
        // Compter les classes actives
        const classes = classesRes.data.results || classesRes.data || []
        const activeClasses = Array.isArray(classes) ? classes.filter((c: any) => c.is_active !== false).length : 0
        
        // Compter les livres disponibles
        const books = booksRes.data.results || booksRes.data || []
        const availableBooks = Array.isArray(books) ? books.length : 0
        
        return { 
          students, 
          teachers, 
          payments, 
          enrollments,
          attendanceRate: parseFloat(String(attendanceRate)),
          averageGrade: parseFloat(String(averageGrade)),
          activeClasses,
          availableBooks
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
        return {
          students: 0,
          teachers: 0,
          payments: 0,
          enrollments: 0,
          attendanceRate: 0,
          averageGrade: 0,
          activeClasses: 0,
          availableBooks: 0
        }
      }
    },
  })

  const statCards = [
    {
      title: 'Élèves',
      value: stats?.students || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Enseignants',
      value: stats?.teachers || 0,
      icon: GraduationCap,
      color: 'bg-green-500',
    },
    {
      title: 'Paiements',
      value: stats?.payments || 0,
      icon: CreditCard,
      color: 'bg-yellow-500',
    },
    {
      title: 'Inscriptions',
      value: stats?.enrollments || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ]

  const performanceCards = [
    {
      title: 'Taux de présence',
      value: `${stats?.attendanceRate || 0}%`,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Moyenne générale',
      value: `${stats?.averageGrade || 0}/20`,
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Classes actives',
      value: stats?.activeClasses || 0,
      icon: BookOpen,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Livres disponibles',
      value: stats?.availableBooks || 0,
      icon: Library,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Tableau de bord</h1>
      
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {isLoading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Indicateurs de performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`p-6 ${stat.bgColor} border-0`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {isLoading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg bg-white dark:bg-gray-800`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
