import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Eye, MessageSquare, FileText, Plus, XCircle, Send, BookOpen } from 'lucide-react'
import { cn } from '@/utils/cn'
import { userFullName } from '@/utils/name'
import toast from 'react-hot-toast'

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

interface PedagogicalAdvice {
  id: number
  title: string
  teacher: number
  teacher_name: string
  student: number
  student_name: string
  advice: string
  category: string
  resources: string | null
  is_active: boolean
  created_at: string
}

export default function TeacherTutoring() {
  const queryClient = useQueryClient()
  const [selectedReport, setSelectedReport] = useState<TutoringReport | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<TutoringMessage | null>(null)
  const [showReportDetails, setShowReportDetails] = useState(false)
  const [showMessageDetails, setShowMessageDetails] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [showAdviceForm, setShowAdviceForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'reports' | 'messages' | 'advice'>('reports')
  const [reportFilter, setReportFilter] = useState<'all' | 'draft' | 'shared'>('all')
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'important'>('all')

  // Récupérer les étudiants de l'enseignant
  const { data: students } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: async () => {
      const response = await api.get('/auth/students/')
      return response.data
    },
  })

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['teacher-tutoring-reports', reportFilter],
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
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['teacher-tutoring-messages', messageFilter],
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
  })

  const { data: advice, isLoading: adviceLoading } = useQuery({
    queryKey: ['teacher-pedagogical-advice'],
    queryFn: async () => {
      const response = await api.get('/tutoring/pedagogical-advice/')
      return response.data
    },
  })

  // Mutations
  const createReportMutation = useMutation({
    mutationFn: (data: any) => api.post('/tutoring/reports/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-tutoring-reports'] })
      toast.success('Rapport créé avec succès')
      setShowReportForm(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Erreur lors de la création du rapport')
    },
  })

  const createMessageMutation = useMutation({
    mutationFn: (data: any) => api.post('/tutoring/messages/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-tutoring-messages'] })
      toast.success('Message envoyé avec succès')
      setShowMessageForm(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Erreur lors de l\'envoi du message')
    },
  })

  const createAdviceMutation = useMutation({
    mutationFn: (data: any) => api.post('/tutoring/pedagogical-advice/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-pedagogical-advice'] })
      toast.success('Conseil pédagogique créé avec succès')
      setShowAdviceForm(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Erreur lors de la création du conseil')
    },
  })

  const shareReportMutation = useMutation({
    mutationFn: (id: number) => api.post(`/tutoring/reports/${id}/share_with_parent/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-tutoring-reports'] })
      toast.success('Rapport partagé avec le parent')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Erreur lors du partage')
    },
  })

  const handleSubmitReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      student: parseInt(formData.get('student') as string),
      title: formData.get('title') as string,
      report_period_start: formData.get('report_period_start') as string,
      report_period_end: formData.get('report_period_end') as string,
      academic_progress: formData.get('academic_progress') as string,
      behavior_observations: formData.get('behavior_observations') as string || null,
      recommendations: formData.get('recommendations') as string,
      is_draft: formData.get('is_draft') === 'true',
    }
    createReportMutation.mutate(data)
  }

  const handleSubmitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      student: parseInt(formData.get('student') as string),
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      message_type: formData.get('message_type') as string || 'GENERAL',
    }
    createMessageMutation.mutate(data)
  }

  const handleSubmitAdvice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      student: parseInt(formData.get('student') as string),
      title: formData.get('title') as string,
      advice: formData.get('advice') as string,
      category: formData.get('category') as string || 'OTHER',
      resources: formData.get('resources') as string || null,
    }
    createAdviceMutation.mutate(data)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Encadrement à Domicile</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Rapports</h2>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                {reports?.results?.length || 0}
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
            </div>
            <MessageSquare className="w-12 h-12 text-green-600 dark:text-green-400 opacity-50" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Conseils</h2>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {advice?.results?.length || 0}
              </div>
            </div>
            <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Onglets */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Rapports d'encadrement</span>
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
          </button>
          <button
            onClick={() => setActiveTab('advice')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
              activeTab === 'advice'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>Conseils pédagogiques</span>
          </button>
        </nav>
      </div>

      {/* Contenu selon l'onglet */}
      {activeTab === 'reports' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Rapports d'encadrement</h2>
            <div className="flex items-center space-x-2">
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value as 'all' | 'draft' | 'shared')}
                className="input text-sm"
              >
                <option value="all">Tous</option>
                <option value="draft">Brouillons</option>
                <option value="shared">Partagés</option>
              </select>
              <button
                onClick={() => setShowReportForm(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau rapport</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Élève</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Période</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">Chargement...</td>
                  </tr>
                ) : !reports?.results || reports?.results?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
                        {report.is_draft && (
                          <button
                            onClick={() => shareReportMutation.mutate(report.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="Partager avec le parent"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'messages' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
            <div className="flex items-center space-x-2">
              <select
                value={messageFilter}
                onChange={(e) => setMessageFilter(e.target.value as 'all' | 'unread' | 'important')}
                className="input text-sm"
              >
                <option value="all">Tous</option>
                <option value="unread">Non lus</option>
                <option value="important">Importants</option>
              </select>
              <button
                onClick={() => setShowMessageForm(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau message</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Sujet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Élève</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Destinataire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {messagesLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">Chargement...</td>
                  </tr>
                ) : !messages?.results || messages?.results?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Aucun message trouvé
                    </td>
                  </tr>
                ) : (
                  messages?.results?.map((message: TutoringMessage) => (
                    <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{message.subject}</div>
                        {!message.is_read && (
                          <span className="badge badge-warning text-xs mt-1">Non lu</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {message.student_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {message.recipient_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(message.created_at), 'dd MMM yyyy', { locale: fr })}
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

      {activeTab === 'advice' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Conseils pédagogiques</h2>
            <button
              onClick={() => setShowAdviceForm(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau conseil</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Élève</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {adviceLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">Chargement...</td>
                  </tr>
                ) : !advice?.results || advice?.results?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Aucun conseil trouvé
                    </td>
                  </tr>
                ) : (
                  advice?.results?.map((item: PedagogicalAdvice) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.student_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            // TODO: Afficher les détails
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

      {/* Formulaire de création de rapport */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nouveau rapport d'encadrement</h2>
              <button
                onClick={() => setShowReportForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Élève *</label>
                <select name="student" required className="input">
                  <option value="">Sélectionner un élève</option>
                  {students?.results?.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {userFullName(student.user)} - {student.student_id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
                <input type="text" name="title" required className="input" placeholder="Titre du rapport" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Début de période *</label>
                  <input type="date" name="report_period_start" required className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin de période *</label>
                  <input type="date" name="report_period_end" required className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progrès scolaire *</label>
                <textarea name="academic_progress" required rows={4} className="input" placeholder="Décrivez le progrès scolaire..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observations comportementales</label>
                <textarea name="behavior_observations" rows={3} className="input" placeholder="Observations sur le comportement..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recommandations *</label>
                <textarea name="recommendations" required rows={3} className="input" placeholder="Recommandations..." />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="is_draft" value="true" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enregistrer comme brouillon</span>
                </label>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="btn btn-primary" disabled={createReportMutation.isPending}>
                  {createReportMutation.isPending ? 'Création...' : 'Créer le rapport'}
                </button>
                <button type="button" onClick={() => setShowReportForm(false)} className="btn btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire de création de message */}
      {showMessageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nouveau message</h2>
              <button
                onClick={() => setShowMessageForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Élève *</label>
                <select name="student" required className="input">
                  <option value="">Sélectionner un élève</option>
                  {students?.results?.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {userFullName(student.user)} - {student.student_id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sujet *</label>
                <input type="text" name="subject" required className="input" placeholder="Sujet du message" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de message</label>
                <select name="message_type" className="input">
                  <option value="GENERAL">Général</option>
                  <option value="QUESTION">Question</option>
                  <option value="ADVICE">Conseil</option>
                  <option value="UPDATE">Mise à jour</option>
                  <option value="CONCERN">Préoccupation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                <textarea name="message" required rows={6} className="input" placeholder="Votre message..." />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="btn btn-primary" disabled={createMessageMutation.isPending}>
                  {createMessageMutation.isPending ? 'Envoi...' : 'Envoyer'}
                </button>
                <button type="button" onClick={() => setShowMessageForm(false)} className="btn btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire de création de conseil pédagogique */}
      {showAdviceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nouveau conseil pédagogique</h2>
              <button
                onClick={() => setShowAdviceForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitAdvice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Élève *</label>
                <select name="student" required className="input">
                  <option value="">Sélectionner un élève</option>
                  {students?.results?.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {userFullName(student.user)} - {student.student_id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
                <input type="text" name="title" required className="input" placeholder="Titre du conseil" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                <select name="category" className="input">
                  <option value="STUDY_HABITS">Habitudes d'étude</option>
                  <option value="HOMEWORK">Devoirs</option>
                  <option value="BEHAVIOR">Comportement</option>
                  <option value="LEARNING">Apprentissage</option>
                  <option value="MOTIVATION">Motivation</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conseil *</label>
                <textarea name="advice" required rows={6} className="input" placeholder="Votre conseil pédagogique..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ressources recommandées</label>
                <textarea name="resources" rows={3} className="input" placeholder="Ressources, liens utiles..." />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="btn btn-primary" disabled={createAdviceMutation.isPending}>
                  {createAdviceMutation.isPending ? 'Création...' : 'Créer le conseil'}
                </button>
                <button type="button" onClick={() => setShowAdviceForm(false)} className="btn btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal détails rapport */}
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
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Élève</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedReport.student_name}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Période</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedReport.report_period_start && selectedReport.report_period_end
                    ? `${format(new Date(selectedReport.report_period_start), 'dd MMM yyyy', { locale: fr })} - ${format(new Date(selectedReport.report_period_end), 'dd MMM yyyy', { locale: fr })}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Progrès scolaire</label>
                <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-1 whitespace-pre-line">
                  {selectedReport.academic_progress}
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
                  {selectedReport.recommendations}
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
            </div>
          </div>
        </div>
      )}

      {/* Modal détails message */}
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
                  <p className="text-gray-900 dark:text-gray-100">{selectedMessage.sender_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Destinataire</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedMessage.recipient_name}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Élève</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedMessage.student_name}</p>
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
