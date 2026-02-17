import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { BookOpen, FileText, GraduationCap, Library, BookMarked, Calendar, User, CheckCircle, XCircle } from 'lucide-react'

interface StudentDashboardData {
  identity: {
    class_name: string
    titulaire_name: string | null
    school_class_academic_year: string | null
    academic_year?: string
  }
  average_score: number | null
  attendance_by_week: Array<{
    label: string
    present: number
    absent: number
    late: number
    total: number
  }>
}

export default function StudentDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      try {
        const [coursesRes, assignmentsRes, quizzesRes, booksRes] = await Promise.allSettled([
          api.get('/elearning/courses/'),
          api.get('/elearning/assignments/'),
          api.get('/elearning/quizzes/'),
          api.get('/library/books/'),
        ])
        const getCount = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled' ? (r.value?.data?.count ?? r.value?.data?.results?.length ?? 0) : 0
        return {
          courses: getCount(coursesRes),
          assignments: getCount(assignmentsRes),
          exams: getCount(quizzesRes),
          books: getCount(booksRes),
        }
      } catch {
        return { courses: 0, assignments: 0, exams: 0, books: 0 }
      }
    },
  })

  const { data: dashboardData } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const res = await api.get<StudentDashboardData>('/auth/students/student_dashboard/')
      return res.data
    },
  })

  const statCards = [
    { title: 'Cours', value: stats?.courses, icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Devoirs', value: stats?.assignments, icon: FileText, color: 'bg-green-500' },
    { title: 'Examens', value: stats?.exams, icon: GraduationCap, color: 'bg-yellow-500' },
    { title: 'Livres', value: stats?.books, icon: Library, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Mon Tableau de bord</h1>

      {/* Infos classe, année, titulaire, moyenne */}
      {dashboardData && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <User className="w-5 h-5" />
            Mes informations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg">
              <BookMarked className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Classe</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{dashboardData.identity?.class_name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Année académique</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{dashboardData.identity?.school_class_academic_year || dashboardData.identity?.academic_year || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg">
              <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Enseignant titulaire</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{dashboardData.identity?.titulaire_name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Moyenne générale</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{dashboardData.average_score != null ? dashboardData.average_score.toFixed(2) : '—'}</p>
              </div>
            </div>
          </div>

          {/* Présences et absences par semaine */}
          {dashboardData.attendance_by_week?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Présences et absences par semaine</h3>
              <div className="flex flex-wrap gap-3">
                {dashboardData.attendance_by_week.map((week) => (
                  <div key={week.label} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/60">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{week.label}</span>
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {week.present}
                    </span>
                    <span className="flex items-center gap-1 text-red-600 text-sm">
                      <XCircle className="w-4 h-4" />
                      {week.absent}
                    </span>
                    {week.late > 0 && <span className="text-amber-600 text-sm">Retard: {week.late}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{statsLoading ? '...' : (stat.value ?? 0)}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
