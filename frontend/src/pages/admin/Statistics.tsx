import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react'

export default function AdminStatistics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-statistics'],
    queryFn: async () => {
      // Mock statistics - replace with actual API calls
      return {
        totalStudents: 450,
        totalTeachers: 25,
        totalClasses: 18,
        attendanceRate: 92.5,
        averageGrade: 14.2,
      }
    },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Statistiques</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taux de présence</p>
              <p className="text-3xl font-bold">{stats?.attendanceRate || 0}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Moyenne générale</p>
              <p className="text-3xl font-bold">{stats?.averageGrade || 0}/20</p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Classes actives</p>
              <p className="text-3xl font-bold">{stats?.totalClasses || 0}</p>
            </div>
            <BookOpen className="w-12 h-12 text-purple-500" />
          </div>
        </Card>
      </div>
    </div>
  )
}
