import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Calendar, Video } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function TeacherMeetings() {
  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const response = await api.get('/meetings/')
      return response.data
    },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Réunions</h1>

      <div className="space-y-4">
        {isLoading ? (
          <div>Chargement...</div>
        ) : (
          meetings?.results?.map((meeting: any) => (
            <Card key={meeting.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{meeting.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(meeting.meeting_date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                    {meeting.video_link && (
                      <div className="flex items-center space-x-1">
                        <Video className="w-4 h-4" />
                        <a
                          href={meeting.video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          Lien visio
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`badge ${meeting.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                  {meeting.status}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
