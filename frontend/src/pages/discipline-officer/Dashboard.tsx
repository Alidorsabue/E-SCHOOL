import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Calendar, MessageSquare } from 'lucide-react'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'

export default function DisciplineOfficerDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['discipline-officer-stats'],
    queryFn: async () => {
      try {
        const [disciplineRes, requestsRes, meetingsRes] = await Promise.all([
          api.get('/academics/discipline/').catch(() => ({ data: { results: [] } })),
          api.get('/academics/discipline-requests/').catch(() => ({ data: { results: [] } })),
          api.get('/meetings/').catch(() => ({ data: { results: [] } })),
        ])
        const records = disciplineRes.data.results || disciplineRes.data || []
        const requests = requestsRes.data.results || requestsRes.data || []
        const meetings = meetingsRes.data.results || meetingsRes.data || []
        const pendingRequests = (requests as any[]).filter((r: any) => r.status === 'PENDING').length
        const openRecords = (records as any[]).filter((r: any) => r.status === 'OPEN').length
        return {
          disciplineCount: records.length,
          openRecords,
          pendingRequests,
          meetingsCount: meetings.length,
        }
      } catch {
        return { disciplineCount: 0, openRecords: 0, pendingRequests: 0, meetingsCount: 0 }
      }
    },
  })

  const cards = [
    { title: 'Fiches de discipline', value: stats?.disciplineCount ?? 0, icon: AlertCircle, color: 'bg-orange-500' },
    { title: 'Fiches ouvertes', value: stats?.openRecords ?? 0, icon: AlertCircle, color: 'bg-yellow-500' },
    { title: 'Demandes en attente', value: stats?.pendingRequests ?? 0, icon: MessageSquare, color: 'bg-blue-500' },
    { title: 'Réunions', value: stats?.meetingsCount ?? 0, icon: Calendar, color: 'bg-green-500' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Tableau de bord Chargé de discipline</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ title, value, icon: Icon, color }) => (
          <Card key={title} className="p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isLoading ? '...' : value}</p>
              </div>
              <div className={`${color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
