import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { BookOpen, Users, FileText, Calendar } from 'lucide-react'

export default function TeacherDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      // Mock data - replace with actual API
      return {
        classes: 3,
        students: 85,
        assignments: 12,
        meetings: 2,
      }
    },
  })

  const statCards = [
    { title: 'Classes', value: stats?.classes, icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Élèves', value: stats?.students, icon: Users, color: 'bg-green-500' },
    { title: 'Devoirs', value: stats?.assignments, icon: FileText, color: 'bg-yellow-500' },
    { title: 'Réunions', value: stats?.meetings, icon: Calendar, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Tableau de bord Enseignant</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">{isLoading ? '...' : stat.value}</p>
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
