import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Eye, Filter, XCircle, Send, MessageSquare } from 'lucide-react'
import { cn } from '@/utils/cn'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

interface DisciplineRecord {
  id: number
  student: number
  student_name: string
  student_id: string
  school_class: number
  class_name: string
  type: 'POSITIVE' | 'NEGATIVE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  action_taken: string | null
  recorded_by: number | null
  recorded_by_name: string
  status: 'OPEN' | 'RESOLVED' | 'CLOSED'
  resolution_notes: string | null
  resolved_by: number | null
  resolved_by_name: string
  resolved_at: string | null
  closed_by: number | null
  closed_by_name: string
  closed_at: string | null
  date: string
  created_at: string
  updated_at: string
}

interface DisciplineRequest {
  id: number
  discipline_record: number
  discipline_record_detail: {
    id: number
    student_name: string
    date: string
    type: string
    description: string
  }
  parent: number
  parent_name: string
  request_type: 'APOLOGY' | 'PUNISHMENT_LIFT' | 'APPEAL' | 'DISCUSSION'
  message: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  response: string | null
  responded_by: number | null
  responded_by_name: string
  responded_at: string | null
  created_at: string
  updated_at: string
}

export default function ParentDiscipline() {
  const queryClient = useQueryClient()
  const [selectedRecord, setSelectedRecord] = useState<DisciplineRecord | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [requestFormData, setRequestFormData] = useState({
    discipline_record: '',
    request_type: 'APOLOGY' as 'APOLOGY' | 'PUNISHMENT_LIFT' | 'APPEAL' | 'DISCUSSION',
    message: '',
  })

  // Récupérer les enfants
  const { data: children } = useQuery({
    queryKey: ['parent-children-discipline'],
    queryFn: async () => {
      const response = await api.get('/auth/students/')
      return response.data
    },
  })

  // Récupérer les fiches de discipline
  const { data: records, isLoading, error } = useQuery({
    queryKey: ['discipline-records', selectedStudent],
    queryFn: async () => {
      const params = selectedStudent ? { student: selectedStudent } : {}
      const response = await api.get('/academics/discipline/', { params })
      return response.data
    },
    retry: 1,
  })

  // Récupérer les demandes existantes
  const { data: requests } = useQuery({
    queryKey: ['discipline-requests'],
    queryFn: async () => {
      const response = await api.get('/academics/discipline-requests/')
      return response.data
    },
  })

  // Créer une demande
  const createRequestMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/discipline-requests/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipline-requests'] })
      showSuccessToast('Demande envoyée avec succès')
      setShowRequestForm(false)
      setRequestFormData({
        discipline_record: '',
        request_type: 'APOLOGY',
        message: '',
      })
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors de l\'envoi de la demande')
    },
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      OPEN: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      RESOLVED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      CLOSED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    }
    return badges[status] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  }

  const getTypeBadge = (type: string) => {
    return type === 'POSITIVE'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  }

  const getSeverityBadge = (severity: string) => {
    const badges: Record<string, string> = {
      LOW: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      HIGH: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    }
    return badges[severity] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  }

  const getRequestStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      APPROVED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      REJECTED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    }
    return badges[status] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestFormData.discipline_record || !requestFormData.message.trim()) {
      showErrorToast(null, 'Veuillez remplir tous les champs obligatoires')
      return
    }
    // S'assurer que discipline_record est un entier
    const dataToSend = {
      ...requestFormData,
      discipline_record: parseInt(requestFormData.discipline_record, 10),
    }
    createRequestMutation.mutate(dataToSend)
  }

  const hasExistingRequest = (recordId: number) => {
    return requests?.results?.some((req: DisciplineRequest) => 
      req.discipline_record === recordId && req.status === 'PENDING'
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Fiches de Discipline</h1>
        {children?.results && children.results.length > 1 && (
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Tous les enfants</option>
              {children.results.map((child: any) => (
                <option key={child.id} value={child.id}>
                  {userFullName(child.user)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Liste des fiches */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Sévérité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">Chargement...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-red-600 dark:text-red-400">
                    Erreur lors du chargement des fiches
                  </td>
                </tr>
              ) : !records?.results || records?.results?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    Aucune fiche de discipline trouvée
                  </td>
                </tr>
              ) : (
                records?.results?.map((record: DisciplineRecord) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {record.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {record.class_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('badge', getTypeBadge(record.type))}>
                        {record.type === 'POSITIVE' ? 'Positif' : 'Négatif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('badge', getSeverityBadge(record.severity))}>
                        {record.severity === 'LOW' ? 'Faible' : record.severity === 'MEDIUM' ? 'Moyen' : 'Élevé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('badge', getStatusBadge(record.status))}>
                        {record.status === 'OPEN' ? 'Ouvert' : record.status === 'RESOLVED' ? 'Résolu' : 'Fermé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(record.date), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRecord(record)
                          setShowDetails(true)
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="Voir les détails"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {record.status === 'OPEN' && !hasExistingRequest(record.id) && (
                        <button
                          onClick={() => {
                            setRequestFormData({
                              ...requestFormData,
                              discipline_record: record.id.toString(),
                            })
                            setShowRequestForm(true)
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          title="Faire une demande"
                        >
                          <MessageSquare className="w-5 h-5" />
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

      {/* Modal de détails */}
      {showDetails && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Détails de la fiche</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedRecord(null)
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Élève</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedRecord.student_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Classe</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedRecord.class_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <p>
                    <span className={cn('badge', getTypeBadge(selectedRecord.type))}>
                      {selectedRecord.type === 'POSITIVE' ? 'Positif' : 'Négatif'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sévérité</label>
                  <p>
                    <span className={cn('badge', getSeverityBadge(selectedRecord.severity))}>
                      {selectedRecord.severity === 'LOW' ? 'Faible' : selectedRecord.severity === 'MEDIUM' ? 'Moyen' : 'Élevé'}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedRecord.description}</p>
              </div>
              {selectedRecord.action_taken && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Action prise</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRecord.action_taken}</p>
                </div>
              )}
              {selectedRecord.resolution_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes de résolution</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRecord.resolution_notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enregistré par</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRecord.recorded_by_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {format(new Date(selectedRecord.date), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              {selectedRecord.resolved_by_name && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Résolu par</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedRecord.resolved_by_name} le{' '}
                    {selectedRecord.resolved_at
                      ? format(new Date(selectedRecord.resolved_at), 'dd MMM yyyy à HH:mm', { locale: fr })
                      : '-'}
                  </p>
                </div>
              )}
              {selectedRecord.closed_by_name && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fermé par</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedRecord.closed_by_name} le{' '}
                    {selectedRecord.closed_at
                      ? format(new Date(selectedRecord.closed_at), 'dd MMM yyyy à HH:mm', { locale: fr })
                      : '-'}
                  </p>
                </div>
              )}
              {/* Section des demandes existantes */}
              {requests?.results?.filter((req: DisciplineRequest) => req.discipline_record === selectedRecord.id).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Mes demandes</h3>
                  {requests.results
                    .filter((req: DisciplineRequest) => req.discipline_record === selectedRecord.id)
                    .map((req: DisciplineRequest) => (
                      <div key={req.id} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className={cn('badge', getRequestStatusBadge(req.status))}>
                            {req.status === 'PENDING' ? 'En attente' : req.status === 'APPROVED' ? 'Approuvée' : 'Rejetée'}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {req.request_type === 'APOLOGY' ? 'Demande d\'excuse' :
                             req.request_type === 'PUNISHMENT_LIFT' ? 'Demande de levée de punition' :
                             req.request_type === 'APPEAL' ? 'Recours' : 'Discussion'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{req.message}</p>
                        {req.response && (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Réponse de l'école:</p>
                            <p className="text-sm text-gray-900 dark:text-gray-100">{req.response}</p>
                            {req.responded_by_name && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Par {req.responded_by_name} le{' '}
                                {req.responded_at ? format(new Date(req.responded_at), 'dd MMM yyyy à HH:mm', { locale: fr }) : ''}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de demande */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Faire une demande</h2>
              <button
                onClick={() => {
                  setShowRequestForm(false)
                  setRequestFormData({
                    discipline_record: '',
                    request_type: 'APOLOGY',
                    message: '',
                  })
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type de demande *
                </label>
                <select
                  required
                  value={requestFormData.request_type}
                  onChange={(e) => setRequestFormData({ ...requestFormData, request_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="APOLOGY">Demande d'excuse</option>
                  <option value="PUNISHMENT_LIFT">Demande de levée de punition</option>
                  <option value="APPEAL">Recours</option>
                  <option value="DISCUSSION">Discussion</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message/Justification *
                </label>
                <textarea
                  required
                  value={requestFormData.message}
                  onChange={(e) => setRequestFormData({ ...requestFormData, message: e.target.value })}
                  rows={6}
                  placeholder="Expliquez votre demande..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="btn btn-primary flex items-center space-x-2" disabled={createRequestMutation.isPending}>
                  <Send className="w-4 h-4" />
                  <span>{createRequestMutation.isPending ? 'Envoi...' : 'Envoyer la demande'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false)
                    setRequestFormData({
                      discipline_record: '',
                      request_type: 'APOLOGY',
                      message: '',
                    })
                  }}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
