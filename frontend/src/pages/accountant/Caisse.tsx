import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/utils/cn'
import { ArrowDownCircle, ArrowUpCircle, Plus, XCircle, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const SOURCE_LABELS: Record<string, string> = {
  PAYMENT: 'Paiement parent',
  EXPENSE: 'Dépense',
  ADJUSTMENT: 'Ajustement',
  OTHER: 'Autre',
}

const DEFAULT_CURRENCIES = ['CDF', 'USD']

export default function AccountantCaisse() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<any>(null)

  const { data: movements, isLoading: loadingMovements, isError: errorMovements, error: movementsError } = useQuery({
    queryKey: ['caisse-operations'],
    queryFn: async () => {
      const res = await api.get('/payments/caisse/operations/')
      return res.data
    },
  })

  const { data: balance = [], isError: errorBalance, error: balanceError } = useQuery({
    queryKey: ['caisse-balance'],
    queryFn: async () => {
      const res = await api.get('/payments/caisse/balance/')
      return res.data
    },
  })

  const addMovementMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/payments/caisse/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caisse-operations'] })
      queryClient.invalidateQueries({ queryKey: ['caisse-balance'] })
      toast.success('Mouvement enregistré')
      setShowAddForm(false)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || e?.response?.data?.currency?.[0] || 'Erreur'),
  })

  const generateVouchersMutation = useMutation({
    mutationFn: () => api.post('/payments/caisse/generate-missing-vouchers/'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['caisse-operations'] })
      queryClient.invalidateQueries({ queryKey: ['caisse-balance'] })
      const generated = res.data?.generated || 0
      const created = res.data?.created || 0
      const total = res.data?.total || 0
      const errors = res.data?.errors
      
      if (res.data?.message) {
        if (generated > 0 || created > 0) {
          toast.success(res.data.message)
        } else {
          toast(res.data.message, { icon: 'ℹ️' })
        }
      } else if (generated > 0 || created > 0) {
        toast.success(`${created > 0 ? `${created} mouvement(s) créé(s). ` : ''}${generated} bon(s) généré(s).`)
      } else if (total === 0 && created === 0) {
        toast('Aucun mouvement sans document trouvé.', { icon: 'ℹ️' })
      } else {
        toast.error(`Aucun bon généré sur ${total} mouvement(s). Vérifiez les logs serveur.`)
      }
      
      if (errors && errors.length > 0) {
        console.error('Erreurs de génération:', errors)
        toast.error(`Erreurs: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`)
      }
    },
    onError: (e: any) => {
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || 'Erreur lors de la génération'
      toast.error(errorMsg)
      console.error('Erreur génération bons:', e)
    },
  })

  const list = Array.isArray(movements) ? movements : (movements?.results ?? [])
  const balanceList = Array.isArray(balance) && balance.length > 0 ? balance : DEFAULT_CURRENCIES.map((c) => ({ currency: c, total_in: 0, total_out: 0, balance: 0 }))

  const apiError = errorBalance || errorMovements
  const errorMessage = (balanceError as any)?.response?.data?.detail || (movementsError as any)?.response?.data?.detail || (balanceError as any)?.message || (movementsError as any)?.message

  const handleAddMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const amount = (form.querySelector('[name="amount"]') as HTMLInputElement).value
    const num = parseFloat(amount)
    if (!amount || isNaN(num) || num <= 0) {
      toast.error('Montant invalide')
      return
    }
    const formData = new FormData()
    formData.append('movement_type', (form.querySelector('[name="movement_type"]') as HTMLSelectElement).value)
    formData.append('amount', amount)
    formData.append('currency', (form.querySelector('[name="currency"]') as HTMLSelectElement).value)
    const description = (form.querySelector('[name="description"]') as HTMLInputElement).value?.trim()
    if (description) formData.append('description', description)
    const documentInput = form.querySelector('[name="document"]') as HTMLInputElement
    if (documentInput?.files?.[0]) {
      formData.append('document', documentInput.files[0])
    }
    addMovementMutation.mutate(formData)
  }

  const formatAmount = (n: number) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Caisse</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Entrées et sorties des montants (paiements reçus, dépenses payées, ajustements).
      </p>

      {apiError && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          <p className="font-medium">Impossible de charger la caisse</p>
          <p className="text-sm mt-1">{errorMessage || 'Vérifiez que vous êtes bien comptable ou admin et associé à une école.'}</p>
        </div>
      )}

      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Solde par devise</h2>
        <div className="flex flex-wrap gap-4">
          {balanceList.map((b: any) => (
            <div
              key={b.currency}
              className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">{b.currency}</span>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatAmount(Number(b.balance ?? 0))} {b.currency}
              </p>
              <p className="text-xs text-gray-500">
                Entrées: {formatAmount(Number(b.total_in ?? 0))} — Sorties: {formatAmount(Number(b.total_out ?? 0))}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mouvements</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => generateVouchersMutation.mutate()}
              disabled={generateVouchersMutation.isPending}
              className="btn btn-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {generateVouchersMutation.isPending ? 'Génération...' : 'Générer les bons manquants'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un mouvement
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Origine</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Devise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Type(s) de frais</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loadingMovements ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <p className="text-gray-500">Aucun mouvement</p>
                    <p className="text-sm text-gray-400 mt-1">Les montants apparaîtront après validation de paiements, paiement de dépenses ou ajout d&apos;un ajustement.</p>
                  </td>
                </tr>
              ) : (
                list.map((m: any) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedOperation(m)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {m.created_at ? format(new Date(m.created_at), 'dd MMM yyyy HH:mm', { locale: fr }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-sm font-medium',
                        m.movement_type === 'IN' && 'text-green-600 dark:text-green-400',
                        m.movement_type === 'OUT' && 'text-red-600 dark:text-red-400'
                      )}>
                        {m.movement_type === 'IN' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                        {m.movement_type === 'IN' ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {SOURCE_LABELS[m.source] || m.source}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      <span className={m.movement_type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {m.movement_type === 'OUT' ? '-' : '+'}{formatAmount(Number(m.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{m.currency}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{m.fee_type_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {m.document_url ? (
                        <a
                          href={m.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Voir</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{m.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nouveau mouvement (ajustement)</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddMovement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select name="movement_type" required className="input w-full">
                  <option value="IN">Entrée</option>
                  <option value="OUT">Sortie</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant *</label>
                  <input name="amount" type="number" step="0.01" min="0.01" required className="input w-full" placeholder="0.00" />
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optionnel)</label>
                <input name="description" className="input w-full" placeholder="Ex. Ouverture de caisse, Ajustement..." maxLength={255} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bon d&apos;entrée/sortie (optionnel)</label>
                <input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png" className="input w-full" />
                <p className="text-xs text-gray-500 mt-1">Formats acceptés: PDF, JPG, PNG</p>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={addMovementMutation.isPending}>
                  {addMovementMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOperation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedOperation(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Détails de l&apos;opération</h2>
              <button onClick={() => setSelectedOperation(null)} className="text-gray-500 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedOperation.created_at ? format(new Date(selectedOperation.created_at), 'dd MMM yyyy HH:mm', { locale: fr }) : '-'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  <span className={cn(
                    'inline-flex items-center gap-1',
                    selectedOperation.movement_type === 'IN' && 'text-green-600 dark:text-green-400',
                    selectedOperation.movement_type === 'OUT' && 'text-red-600 dark:text-red-400'
                  )}>
                    {selectedOperation.movement_type === 'IN' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                    {selectedOperation.movement_type === 'IN' ? 'Entrée' : 'Sortie'}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Origine:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">{SOURCE_LABELS[selectedOperation.source] || selectedOperation.source}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Montant:</span>
                <p className={cn(
                  'text-sm font-medium',
                  selectedOperation.movement_type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {selectedOperation.movement_type === 'OUT' ? '-' : '+'}{formatAmount(Number(selectedOperation.amount))} {selectedOperation.currency}
                </p>
              </div>
              {selectedOperation.fee_type_name && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type(s) de frais:</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOperation.fee_type_name}</p>
                </div>
              )}
              {selectedOperation.document_url && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Document:</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    <a
                      href={selectedOperation.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger le document
                    </a>
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedOperation.description || '—'}</p>
              </div>
              {selectedOperation.reference_type && selectedOperation.reference_id && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Référence:</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedOperation.reference_type} #{selectedOperation.reference_id}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedOperation(null)} className="btn btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
