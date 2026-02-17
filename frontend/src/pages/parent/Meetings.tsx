import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Calendar, Video, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/utils/cn'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ParentMeetings() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { data: meetings, isLoading, error } = useQuery({
    queryKey: ['parent-meetings'],
    queryFn: async () => {
      const response = await api.get('/meetings/')
      return response.data
    },
  })

  const copyToClipboard = (text: string, codeType: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCode(codeType)
      toast.success('Code copié dans le presse-papiers')
      setTimeout(() => setCopiedCode(null), 2000)
    }).catch(() => {
      toast.error('Erreur lors de la copie')
    })
  }

  const getStatusBadge = (status: string) => {
    if (status === 'CONFIRMED') {
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    }
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Réunions</h1>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">Chargement...</div>
          </Card>
        ) : error ? (
          <Card>
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              Erreur lors du chargement des réunions. Veuillez réessayer plus tard.
            </div>
          </Card>
        ) : !meetings?.results || meetings.results.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Aucune réunion programmée pour le moment.
            </div>
          </Card>
        ) : (
          meetings.results.map((meeting: any) => (
            <Card key={meeting.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{meeting.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{meeting.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(meeting.meeting_date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                    {meeting.video_link && (
                      <div className="flex flex-col space-y-2 mt-2">
                        <div className="flex items-center space-x-1">
                          <Video className="w-4 h-4" />
                          <a
                            href={meeting.video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Rejoindre la visioconférence
                          </a>
                        </div>
                        {meeting.meeting_id && (
                          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-sm">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Code de réunion:</span>
                            <code className="text-primary-600 dark:text-primary-400 font-mono font-semibold">
                              {meeting.meeting_id}
                            </code>
                            <button
                              onClick={() => copyToClipboard(meeting.meeting_id, `meeting-${meeting.id}`)}
                              className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Copier le code"
                            >
                              {copiedCode === `meeting-${meeting.id}` ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                          </div>
                        )}
                        {meeting.meeting_password && (
                          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-sm">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Mot de passe:</span>
                            <code className="text-primary-600 dark:text-primary-400 font-mono font-semibold">
                              {meeting.meeting_password}
                            </code>
                            <button
                              onClick={() => copyToClipboard(meeting.meeting_password, `password-${meeting.id}`)}
                              className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Copier le mot de passe"
                            >
                              {copiedCode === `password-${meeting.id}` ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <span className={cn('badge', getStatusBadge(meeting.status))}>
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
