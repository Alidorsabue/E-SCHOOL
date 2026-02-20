import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { MessageSquare, FileText, Send, Plus, X, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface TutoringReport {
  id: number
  title: string
  teacher_name: string
  student_name: string
  report_period_start: string
  report_period_end: string
  academic_progress: string
  behavior_observations: string | null
  recommendations: string
  parent_feedback: string | null
  report_pdf: string | null
  shared_at: string | null
  created_at: string
}

export default function ParentTutoring() {
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [selectedReport, setSelectedReport] = useState<TutoringReport | null>(null)
  const [showReportDetails, setShowReportDetails] = useState(false)
  const queryClient = useQueryClient()

  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['tutoring-messages'],
    queryFn: async () => {
      const response = await api.get('/tutoring/messages/')
      return response.data
    },
  })

  const { data: reports, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ['tutoring-reports'],
    queryFn: async () => {
      try {
        const response = await api.get('/tutoring/reports/')
        return response.data
      } catch (error: any) {
        console.error('Erreur lors du chargement des rapports:', error)
        throw error
      }
    },
    retry: 1,
  })

  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const response = await api.get('/auth/students/parent_dashboard/')
      return response.data
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/tutoring/messages/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutoring-messages'] })
      setShowMessageForm(false)
      toast.success('Message envoyé avec succès')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Erreur lors de l\'envoi du message')
    },
  })

  const handleSubmitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const studentId = parseInt(formData.get('student') as string)
    
    // Le backend détermine automatiquement le destinataire (enseignant titulaire)
    const messageData = {
      student: studentId,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      message_type: formData.get('message_type') as string || 'GENERAL',
    }
    sendMessageMutation.mutate(messageData)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Encadrement à Domicile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
            </div>
            <button
              onClick={() => setShowMessageForm(true)}
              className="btn btn-primary text-sm flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau message</span>
            </button>
          </div>

          {showMessageForm && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Envoyer un message</h3>
                <button
                  onClick={() => setShowMessageForm(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSubmitMessage} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enfant *
                  </label>
                  <select name="student" required className="input text-sm">
                    <option value="">Sélectionner un enfant</option>
                    {children?.map((child: any) => (
                      <option key={child.identity.id} value={child.identity.id}>
                        {[child.identity.user?.first_name, child.identity.user?.last_name, child.identity.user?.middle_name].filter(Boolean).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="input text-sm"
                    placeholder="Sujet du message"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de message
                  </label>
                  <select name="message_type" className="input text-sm">
                    <option value="GENERAL">Général</option>
                    <option value="QUESTION">Question</option>
                    <option value="CONCERN">Préoccupation</option>
                    <option value="UPDATE">Mise à jour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={3}
                    className="input text-sm"
                    placeholder="Votre message..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  className="btn btn-primary text-sm flex items-center space-x-1"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendMessageMutation.isPending ? 'Envoi...' : 'Envoyer'}</span>
                </button>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {messagesLoading ? (
              <div className="text-center py-4 text-gray-600 dark:text-gray-400">Chargement...</div>
            ) : messagesError ? (
              <div className="text-center py-4 text-red-600 dark:text-red-400">
                Erreur lors du chargement des messages.
              </div>
            ) : !messages?.results || messages.results.length === 0 ? (
              <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                Aucun message disponible.
              </div>
            ) : (
              messages.results.map((message: any) => (
                <div key={message.id} className="border-l-4 border-primary-500 dark:border-primary-400 pl-4 py-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{message.subject}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{message.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(message.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Rapports d'encadrement</h2>
          </div>
          <div className="space-y-3">
            {reportsLoading ? (
              <div className="text-center py-4 text-gray-600 dark:text-gray-400">Chargement...</div>
            ) : reportsError ? (
              <div className="text-center py-4 text-red-600 dark:text-red-400">
                Erreur lors du chargement des rapports.
              </div>
            ) : !reports?.results || reports.results.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-2">Aucun rapport disponible.</p>
                <p className="text-sm">Les rapports d'encadrement partagés par les enseignants apparaîtront ici.</p>
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
                  Contactez l'enseignant de votre enfant pour obtenir des rapports d'encadrement.
                </p>
              </div>
            ) : (
              reports.results.map((report: any) => (
                <div 
                  key={report.id} 
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedReport(report)
                    setShowReportDetails(true)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{report.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {report.teacher_name && `Par ${report.teacher_name}`}
                        {report.report_period_start && report.report_period_end && (
                          <span className="ml-2">
                            • {new Date(report.report_period_start).toLocaleDateString('fr-FR')} - {new Date(report.report_period_end).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {report.academic_progress || 'Aucun contenu disponible'}
                      </p>
                    </div>
                    {report.report_pdf && (
                      <a
                        href={report.report_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        title="Télécharger le PDF"
                      >
                        <FileText className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Modal détails du rapport */}
      {showReportDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Détails du rapport d'encadrement</h2>
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
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Votre retour</label>
                  <p className="text-gray-900 dark:text-gray-100 bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-1 whitespace-pre-line">
                    {selectedReport.parent_feedback}
                  </p>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de partage</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedReport.shared_at
                        ? format(new Date(selectedReport.shared_at), 'dd MMM yyyy à HH:mm', { locale: fr })
                        : format(new Date(selectedReport.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  {selectedReport.report_pdf && (
                    <a
                      href={selectedReport.report_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Télécharger le PDF</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
