import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Check, X, FileText } from 'lucide-react'
import { showErrorToast, showSuccessToast } from '@/utils/toast'
import { cn } from '@/utils/cn'

export default function AdminPayments() {
  const queryClient = useQueryClient()
  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await api.get('/payments/payments/')
      return response.data
    },
    retry: 1,
  })

  const validateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/payments/payments/${id}/validate/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      showSuccessToast('Paiement validé avec succès')
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors de la validation du paiement')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.post(`/payments/payments/${id}/reject/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      showSuccessToast('Paiement rejeté')
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors du rejet du paiement')
    },
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      FAILED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      PROCESSING: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    }
    return badges[status] || 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Gestion des Paiements</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Méthode</th>
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
                    Erreur lors du chargement des paiements
                  </td>
                </tr>
              ) : !payments?.results || payments?.results?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    Aucun paiement trouvé
                  </td>
                </tr>
              ) : (
                payments?.results?.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                      {payment.payment_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {payment.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {payment.amount} {payment.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {payment.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('badge', getStatusBadge(payment.status))}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {payment.payment_date
                        ? format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: fr })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {payment.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => validateMutation.mutate(payment.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="Valider"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(payment.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title="Rejeter"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {payment.status === 'COMPLETED' && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await api.get(`/payments/payments/${payment.id}/download_receipt/`, {
                                responseType: 'blob',
                              })
                              const url = window.URL.createObjectURL(new Blob([response.data]))
                              const link = document.createElement('a')
                              link.href = url
                              link.setAttribute('download', `receipt_${payment.payment_id}.pdf`)
                              document.body.appendChild(link)
                              link.click()
                              link.remove()
                              window.URL.revokeObjectURL(url)
                              showSuccessToast('Reçu téléchargé avec succès')
                            } catch (error: any) {
                              showErrorToast(error, 'Erreur lors du téléchargement du reçu')
                            }
                          }}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center space-x-1"
                          title="Télécharger le reçu"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Reçu</span>
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
    </div>
  )
}
