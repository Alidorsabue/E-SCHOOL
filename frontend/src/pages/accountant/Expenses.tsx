import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, XCircle, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'

const CATEGORY_LABELS: Record<string, string> = {
  SALARIES: 'Salaires',
  MAINTENANCE: 'Entretien / Maintenance',
  MATERIEL: 'Matériel pédagogique',
  UTILITIES: 'Eau / Électricité / Internet',
  EVENTS: 'Activités / Événements',
  OTHER: 'Autre',
}
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  PAID: 'Payée',
  REJECTED: 'Rejetée',
}
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  MOBILE_MONEY_MPESA: 'M-Pesa',
  MOBILE_MONEY_ORANGE: 'Orange Money',
  MOBILE_MONEY_AIRTEL: 'Airtel Money',
  BANK_TRANSFER: 'Virement bancaire',
  CARD: 'Carte bancaire',
  ONLINE: 'Paiement en ligne',
}

export default function AccountantExpenses() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/payments/expenses/')
      return res.data
    },
  })

  const { data: feeTypes } = useQuery({
    queryKey: ['fee-types'],
    queryFn: async () => {
      const res = await api.get('/payments/fee-types/')
      return res.data?.results ?? res.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/payments/expenses/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Dépense enregistrée')
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/payments/expenses/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Dépense modifiée')
      setEditingExpense(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/payments/expenses/${id}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Statut mis à jour')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Erreur'),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const deductRaw = (form.querySelector('[name="deduct_from_fee_type"]') as HTMLSelectElement).value
    const data = {
      title: (form.querySelector('[name="title"]') as HTMLInputElement).value,
      category: (form.querySelector('[name="category"]') as HTMLSelectElement).value,
      amount: (form.querySelector('[name="amount"]') as HTMLInputElement).value,
      currency: (form.querySelector('[name="currency"]') as HTMLSelectElement).value,
      payment_method: (form.querySelector('[name="payment_method"]') as HTMLSelectElement).value,
      deduct_from_fee_type: deductRaw ? Number(deductRaw) : null,
      description: (form.querySelector('[name="description"]') as HTMLTextAreaElement).value || null,
      reference: (form.querySelector('[name="reference"]') as HTMLInputElement).value || null,
      expense_date: (form.querySelector('[name="expense_date"]') as HTMLInputElement).value || null,
    }
    createMutation.mutate(data)
  }

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingExpense) return
    if (editingExpense.status !== 'PENDING') {
      toast.error('Seules les dépenses en attente peuvent être modifiées')
      return
    }
    const form = e.currentTarget
    const deductRaw = (form.querySelector('[name="deduct_from_fee_type"]') as HTMLSelectElement).value
    const data: any = {
      title: (form.querySelector('[name="title"]') as HTMLInputElement).value,
      category: (form.querySelector('[name="category"]') as HTMLSelectElement).value,
      amount: (form.querySelector('[name="amount"]') as HTMLInputElement).value,
      currency: (form.querySelector('[name="currency"]') as HTMLSelectElement).value,
      payment_method: (form.querySelector('[name="payment_method"]') as HTMLSelectElement).value,
      deduct_from_fee_type: deductRaw ? Number(deductRaw) : null,
      description: (form.querySelector('[name="description"]') as HTMLTextAreaElement).value || null,
      reference: (form.querySelector('[name="reference"]') as HTMLInputElement).value || null,
      expense_date: (form.querySelector('[name="expense_date"]') as HTMLInputElement).value || null,
    }
    updateMutation.mutate({ id: editingExpense.id, data })
  }

  const results = expenses?.results || expenses || []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestion des Dépenses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle dépense</span>
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Libellé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Type paiement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Imputé au</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-4 text-center text-gray-500">Chargement...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-4 text-center text-gray-500">Aucune dépense</td></tr>
              ) : (
                results.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{exp.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{CATEGORY_LABELS[exp.category] || exp.category}</td>
                    <td className="px-6 py-4 text-sm font-medium">{exp.amount} {exp.currency}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{PAYMENT_METHOD_LABELS[exp.payment_method] || exp.payment_method || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{exp.deduct_from_fee_type_name ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'badge',
                        exp.status === 'PAID' && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
                        exp.status === 'APPROVED' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
                        exp.status === 'PENDING' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                        exp.status === 'REJECTED' && 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      )}>
                        {STATUS_LABELS[exp.status] || exp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {exp.expense_date ? format(new Date(exp.expense_date), 'dd MMM yyyy', { locale: fr }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {exp.status === 'PENDING' && (
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" /> Modifier
                        </button>
                      )}
                      {exp.status === 'PENDING' && isAdmin && (
                        <>
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: exp.id, status: 'APPROVED' })}
                            className="text-green-600 dark:text-green-400 hover:underline"
                          >Approuver</button>
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: exp.id, status: 'REJECTED' })}
                            className="text-red-600 dark:text-red-400 hover:underline"
                          >Rejeter</button>
                        </>
                      )}
                      {exp.status === 'APPROVED' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: exp.id, status: 'PAID' })}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >Marquer payée</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nouvelle dépense</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Libellé *</label>
                <input name="title" required className="input w-full" placeholder="Libellé" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                <select name="category" className="input w-full">
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant *</label>
                  <input name="amount" type="number" step="0.01" required className="input w-full" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devise</label>
                  <select name="currency" className="input w-full">
                    <option value="CDF">CDF</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de paiement</label>
                <select name="payment_method" className="input w-full">
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Déductible en caisse selon ce type.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imputé au type de frais</label>
                <select name="deduct_from_fee_type" className="input w-full">
                  <option value="">— Aucun —</option>
                  {(Array.isArray(feeTypes) ? feeTypes : []).map((ft: { id: number; name: string; currency?: string }) => (
                    <option key={ft.id} value={ft.id}>{ft.name}{ft.currency ? ` (${ft.currency})` : ''}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Type de frais dont sera déduite cette dépense (optionnel).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" rows={3} className="input w-full" placeholder="Description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Référence</label>
                <input name="reference" className="input w-full" placeholder="Référence" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input name="expense_date" type="date" className="input w-full" />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Modifier la dépense</h2>
              <button onClick={() => setEditingExpense(null)} className="text-gray-500 hover:text-gray-700"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Libellé *</label>
                <input name="title" required className="input w-full" defaultValue={editingExpense.title} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                <select name="category" className="input w-full" defaultValue={editingExpense.category}>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant *</label>
                  <input name="amount" type="number" step="0.01" required className="input w-full" defaultValue={editingExpense.amount} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devise</label>
                  <select name="currency" className="input w-full" defaultValue={editingExpense.currency || 'CDF'}>
                    <option value="CDF">CDF</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de paiement</label>
                <select name="payment_method" className="input w-full" defaultValue={editingExpense.payment_method || 'CASH'}>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imputé au type de frais</label>
                <select name="deduct_from_fee_type" className="input w-full" defaultValue={editingExpense.deduct_from_fee_type ?? ''}>
                  <option value="">— Aucun —</option>
                  {(Array.isArray(feeTypes) ? feeTypes : []).map((ft: { id: number; name: string; currency?: string }) => (
                    <option key={ft.id} value={ft.id}>{ft.name}{ft.currency ? ` (${ft.currency})` : ''}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Type de frais dont sera déduite cette dépense (optionnel).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" rows={3} className="input w-full" defaultValue={editingExpense.description || ''} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Référence</label>
                <input name="reference" className="input w-full" defaultValue={editingExpense.reference || ''} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input name="expense_date" type="date" className="input w-full" defaultValue={editingExpense.expense_date ? editingExpense.expense_date.slice(0, 10) : ''} />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setEditingExpense(null)} className="btn btn-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
