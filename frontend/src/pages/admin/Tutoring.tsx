import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Eye, MessageSquare, FileText, Filter, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface TutoringReport {
  id: number
  title: string
  teacher: number
  teacher_name: string
  student: number
  student_name: string
  report_period_start: string
  report_period_end: string
  academic_progress: string
  behavior_observations: string | null
  recommendations: string
  parent_feedback: string | null
  is_draft: boolean
  is_shared_with_parent: boolean
  shared_at: string | null
  created_at: string
  updated_at: string
}

interface TutoringMessage {
  id: number
  sender: number
  sender_name: string
  recipient: number
  recipient_name: string
  student: number
  student_name: string
  subject: string
  message: string
  message_type: 'QUESTION' | 'ADVICE' | 'UPDATE' | 'CONCERN' | 'GENERAL'
  is_read: boolean
  is_important: boolean
  created_at: string
}

export default function AdminTutoring() {
  const [selectedReport, setSelectedReport] = useState<TutoringReport | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<TutoringMessage | null>(null)
  const [showReportDetails, setShowReportDetails] = useState(false)
  const [showMessageDetails, setShowMessageDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<'reports' | 'messages'>('reports')
  const [reportFilter, setReportFilter] = useState<'all' | 'draft' | 'shared'>('all')
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'important'>('all')

  const { data: reports, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ['tutoring-reports', reportFilter],
    queryFn: async () => {
      const params: Record<string, string> = { page_size: '100' }
      if (reportFilter === 'draft') {
        params['is_draft'] = 'true'
      } else if (reportFilter === 'shared') {
        params['is_shared_with_parent'] = 'true'
      }
      const response = await api.get('/tutoring/reports/', { params })
      return response.data
    },
    retry: 1,
  })

  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['tutoring-messages', messageFilter],
    queryFn: async () => {
      const params: Record<string, string> = { page_size: '100' }
      if (messageFilter === 'unread') {
        params['is_read'] = 'false'
      } else if (messageFilter === 'important') {
        params['is_important'] = 'true'
      }
      const response = await api.get('/tutoring/messages/', { params })
      return response.data
    },
    retry: 1,
  })

  const getMessageTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      QUESTION: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      ADVICE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      UPDATE: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      CONCERN: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      GENERAL: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
    }
    return badges[type] || badges.GENERAL
  }

  const getMessageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      QUESTION: 'Question',
      ADVICE: 'Conseil',
      UPDATE: 'Mise à jour',
      CONCERN: 'Préoccupation',
      GENERAL: 'Général',
    }
    return labels[type] || type
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Gestion de l'Encadrement à Domicile</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Rapports d'encadrement</h2>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                {reports?.results?.length || 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {reports?.results?.filter((r: TutoringReport) => r.is_draft).length || 0} brouillons
              </div>
            </div>
            <FileText className="w-12 h-12 text-primary-600 dark:text-primary-400 opacity-50" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Messages</h2>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {messages?.results?.length || 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {messages?.results?.filter((m: TutoringMessage) => !m.is_read).length || 0} non lus
              </div>
            </div>
            <MessageSquare className="w-12 h-12 text-green-600 dark:text-green-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Onglets */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            Rapports d'encadrement
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
              activeTab === 'messages'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
            {messages?.results?.filter((m: TutoringMessage) => !m.is_read).length > 0 && (
              <span className="badge bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                {messages.results.filter((m: TutoringMessage) => !m.is_read).length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Contenu selon l'onglet */}
      {activeTab === 'reports' ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Rapports d'encadrement</h2>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value as 'all' | 'draft' | 'shared')}
                className="input text-sm"
              >
                <option value="all">Tous</option>
                <option value="draft">Brouillons</option>
                <option value="shared">Partagés</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Enseignant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Élève</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Période</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">Chargement...</td>
                  </tr>
                ) : reportsError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-red-600 dark:text-red-400">
                      Erreur lors du chargement des rapports
                    </td>
                  </tr>
                ) : !reports?.results || reports?.results?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Aucun rapport trouvé
                    </td>
                  </tr>
                ) : (
                  reports?.results?.map((report: TutoringReport) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{report.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {report.teacher_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {report.student_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {report.report_period_start && report.report_period_end
                          ? `${format(new Date(report.report_period_start), 'dd MMM', { locale: fr })} - ${format(new Date(report.report_period_end), 'dd MMM yyyy', { locale: fr })}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {report.is_draft ? (
                            <span className="badge badge-warning">Brouillon</span>
                          ) : (
                            <span className="badge badge-success">Publié</span>
                          )}
                          {report.is_shared_with_parent && (
                            <span className="badge badge-info text-xs">Partagé</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedReport(report)
                            setShowReportDetails(true)
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={messageFilter}
                onChange={(e) => setMessageFilter(e.target.value as 'all' | 'unread' | 'important')}
                className="input text-sm"
              >
                <option value="all">Tous</option>
                <option value="unread">Non lus</option>
                <option value="important">Importants</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Sujet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Expéditeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Destinataire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Élève</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {messagesLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">Chargement...</td>
                  </tr>
                ) : messagesError ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-red-600 dark:text-red-400">
                      Erreur lors du chargement des messages
                    </td>
                  </tr>
                ) : !messages?.results || messages?.results?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Aucun message trouvé
                    </td>
                  </tr>
                ) : (
                  messages?.results?.map((message: TutoringMessage) => (
                    <tr key={message.id} className={cn('hover:bg-gray-50 dark:hover:bg-gray-700/50', !message.is_read && 'bg-blue-50 dark:bg-blue-900/10')}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{message.subject}</div>
                          {message.is_important && (
                            <span className="badge badge-danger text-xs">Important</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {message.sender_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {message.recipient_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {message.student_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn('badge', getMessageTypeBadge(message.message_type))}>
                          {getMessageTypeLabel(message.message_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(message.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {message.is_read ? (
                          <span className="badge badge-success">Lu</span>
                        ) : (
                          <span className="badge badge-warning">Non lu</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedMessage(message)
                            setShowMessageDetails(true)
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal détails du rapport */}
      {showReportDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Détails du rapport</h2>
              <button
                onClick={() => {
                  setShowReportDetails(false)
                  setSelectedReport(null)
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold">{selectedReport.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Période</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedReport.report_period_start && selectedReport.report_period_end
                      ? `${format(new Date(selectedReport.report_period_start), 'dd MMM yyyy', { locale: fr })} - ${format(new Date(selectedReport.report_period_end), 'dd MMM yyyy', { locale: fr })}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enseignant</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedReport.teacher_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Élève</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedReport.student_name || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Progrès scolaire</label>
                <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-1 whitespace-pre-line">
                  {selectedReport.academic_progress || 'Aucun progrès scolaire enregistré'}
                </p>
              </div>
              {selectedReport.behavior_observations && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Observations comportementales</label>
                  <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-1 whitespace-pre-line">
                    {selectedReport.behavior_observations}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Recommandations</label>
                <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-1 whitespace-pre-line">
                  {selectedReport.recommendations || 'Aucune recommandation'}
                </p>
              </div>
              {selectedReport.parent_feedback && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Retour du parent</label>
                  <p className="text-gray-900 dark:text-gray-100 bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-1 whitespace-pre-line">
                    {selectedReport.parent_feedback}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                  <div className="flex space-x-2 mt-1">
                    {selectedReport.is_draft ? (
                      <span className="badge badge-warning">Brouillon</span>
                    ) : (
                      <span className="badge badge-success">Publié</span>
                    )}
                    {selectedReport.is_shared_with_parent && (
                      <span className="badge badge-info">Partagé avec le parent</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de création</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {format(new Date(selectedReport.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal détails du message */}
      {showMessageDetails && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Détails du message</h2>
              <button
                onClick={() => {
                  setShowMessageDetails(false)
                  setSelectedMessage(null)
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sujet</label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold">{selectedMessage.subject}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expéditeur</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedMessage.sender_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Destinataire</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedMessage.recipient_name || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Élève concerné</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedMessage.student_name || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <p>
                    <span className={cn('badge', getMessageTypeBadge(selectedMessage.message_type))}>
                      {getMessageTypeLabel(selectedMessage.message_type)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                  <p>
                    {selectedMessage.is_read ? (
                      <span className="badge badge-success">Lu</span>
                    ) : (
                      <span className="badge badge-warning">Non lu</span>
                    )}
                    {selectedMessage.is_important && (
                      <span className="badge badge-danger ml-2">Important</span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-1 whitespace-pre-line">
                  {selectedMessage.message}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {format(new Date(selectedMessage.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
