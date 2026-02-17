import { useState } from 'react'
import { X } from 'lucide-react'
import { Card } from '@/components/ui/Card'

type PaymentFormMode = 'parent' | 'accountant'

type ChildOption = { identity: { id: number; user?: { first_name?: string; last_name?: string }; student_id?: string } }
type StudentOption = { id: number; user?: { first_name?: string; last_name?: string }; student_id?: string; parent?: number }
type ParentOption = { id: number; first_name?: string; last_name?: string; email?: string }
type FeeTypeOption = { id: number; name: string; amount: string | number; currency: string }

interface PaymentFormProps {
  mode: PaymentFormMode
  /** Pour parent : liste des enfants (parent_dashboard). Pour accountant : non utilisé ici. */
  children?: ChildOption[]
  /** Pour accountant : liste des parents (payeurs). */
  parents?: ParentOption[]
  /** Pour accountant : liste de tous les élèves (pour filtrer par parent). */
  students?: StudentOption[]
  feeTypes?: FeeTypeOption[]
  onSubmit: (payload: Record<string, unknown>) => void
  onCancel: () => void
  isPending: boolean
  /** Titre du formulaire */
  title?: string
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'MOBILE_MONEY_MPESA', label: 'M-Pesa' },
  { value: 'MOBILE_MONEY_ORANGE', label: 'Orange Money' },
  { value: 'MOBILE_MONEY_AIRTEL', label: 'Airtel Money' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'CARD', label: 'Carte bancaire' },
  { value: 'ONLINE', label: 'Paiement en ligne' },
]

export default function PaymentForm({
  mode,
  children = [],
  parents = [],
  students = [],
  feeTypes = [],
  onSubmit,
  onCancel,
  isPending,
  title = 'Nouveau paiement',
}: PaymentFormProps) {
  const [selectedParentId, setSelectedParentId] = useState<string>('')

  const studentOptions =
    mode === 'parent'
      ? children
      : students.filter((s) => !selectedParentId || s.parent === Number(selectedParentId))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const payload: Record<string, unknown> = {
      student: parseInt(formData.get('student') as string),
      amount: parseFloat(formData.get('amount') as string),
      currency: (formData.get('currency') as string) || 'CDF',
      payment_method: formData.get('payment_method') as string,
      description: (formData.get('description') as string) || '',
      reference_number: (formData.get('reference_number') as string) || '',
    }
    if (mode === 'accountant' && formData.get('user')) {
      payload.user = parseInt(formData.get('user') as string)
    }
    const feeType = formData.get('fee_type')
    if (feeType) payload.fee_type = parseInt(feeType as string)
    const academicYear = formData.get('academic_year')
    if (academicYear) payload.academic_year = academicYear as string
    if (mode === 'accountant' && formData.get('status')) {
      payload.status = formData.get('status') as string
    }
    onSubmit(payload)
  }

  const feeTypesList = Array.isArray(feeTypes) ? feeTypes : ((feeTypes as { results?: FeeTypeOption[] })?.results ?? [])

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'accountant' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Parent (payeur) *
            </label>
            <select
              name="user"
              required
              className="input w-full"
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
            >
              <option value="">Sélectionner un parent</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} {p.email ? `(${p.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enfant *
          </label>
          <select name="student" required className="input w-full">
            <option value="">
              {mode === 'accountant' ? 'Sélectionner un enfant (du parent choisi)' : 'Sélectionner un enfant'}
            </option>
            {mode === 'parent' &&
              children.map((child: ChildOption) => (
                <option key={child.identity.id} value={child.identity.id}>
                  {child.identity.user?.first_name} {child.identity.user?.last_name} - {child.identity.student_id}
                </option>
              ))}
            {mode === 'accountant' &&
              (studentOptions as StudentOption[]).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user?.first_name} {s.user?.last_name} - {s.student_id}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type de frais
          </label>
          <select
            name="fee_type"
            className="input w-full"
            onChange={(e) => {
              const selectedFee = feeTypesList.find((f: FeeTypeOption) => f.id === parseInt(e.target.value))
              if (selectedFee) {
                const amountInput = document.querySelector('input[name="amount"]') as HTMLInputElement
                if (amountInput) amountInput.value = String(selectedFee.amount)
              }
            }}
          >
            <option value="">Sélectionner un type de frais (optionnel)</option>
            {feeTypesList.map((fee: FeeTypeOption) => (
              <option key={fee.id} value={fee.id}>
                {fee.name} - {fee.amount} {fee.currency}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Montant *
          </label>
          <input
            type="number"
            name="amount"
            step="0.01"
            required
            className="input w-full"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Devise *
          </label>
          <select name="currency" required className="input w-full">
            <option value="CDF">CDF</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Méthode de paiement *
          </label>
          <select name="payment_method" required className="input w-full">
            <option value="">Sélectionner une méthode</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Numéro de référence
          </label>
          <input
            type="text"
            name="reference_number"
            className="input w-full"
            placeholder="Numéro de transaction (optionnel)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            className="input w-full"
            placeholder="Description du paiement (optionnel)"
          />
        </div>

        {mode === 'accountant' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut
              </label>
              <select name="status" className="input w-full">
                <option value="COMPLETED">Complété (avec reçu)</option>
                <option value="PENDING">En attente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Année académique
              </label>
              <input
                type="text"
                name="academic_year"
                className="input w-full"
                placeholder="ex. 2025-2026"
                defaultValue={`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
              />
            </div>
          </>
        )}

        <div className="flex space-x-3">
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? 'Création...' : 'Créer le paiement'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Annuler
          </button>
        </div>
      </form>
    </Card>
  )
}
