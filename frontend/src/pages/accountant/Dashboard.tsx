import { useQuery } from '@tanstack/react-query'
import { CreditCard, TrendingUp, DollarSign, Users, Wallet, BarChart3 } from 'lucide-react'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'

const formatAmount = (amount: number) => {
  return Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AccountantDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['accountant-stats'],
    queryFn: async () => {
      try {
        const [
          paymentsRes,
          pendingRes,
          expensesRes,
          balanceRes,
          studentsRes,
          paymentMethodsRes,
        ] = await Promise.all([
          api.get('/payments/payments/').catch(() => ({ data: { results: [], count: 0 } })),
          api.get('/payments/payments/?status=PENDING').catch(() => ({ data: { results: [], count: 0 } })),
          api.get('/payments/expenses/').catch(() => ({ data: { results: [], count: 0 } })),
          api.get('/payments/caisse/balance/').catch(() => ({ data: [] })),
          api.get('/auth/students/').catch(() => ({ data: { results: [], count: 0 } })),
          api.get('/payments/payments/stats-by-payment-method/').catch(() => ({ data: [] })),
        ])

        const payments = paymentsRes.data.results || paymentsRes.data || []
        const pending = pendingRes.data.results || pendingRes.data || []
        const expenses = expensesRes.data.results || expensesRes.data || []
        const balance = balanceRes.data || []
        const students = studentsRes.data.count || (studentsRes.data.results?.length || 0)
        const paymentMethods = paymentMethodsRes.data || []

        // Calculer les totaux par devise pour les paiements complétés
        const completedPayments = (payments as any[]).filter((p: any) => p.status === 'COMPLETED')
        const paymentsByCurrency: Record<string, number> = {}
        completedPayments.forEach((p: any) => {
          const currency = p.currency || 'CDF'
          paymentsByCurrency[currency] = (paymentsByCurrency[currency] || 0) + parseFloat(p.amount || 0)
        })

        // Calculer les totaux par devise pour les dépenses payées
        const paidExpenses = (expenses as any[]).filter((e: any) => e.status === 'PAID')
        const expensesByCurrency: Record<string, number> = {}
        paidExpenses.forEach((e: any) => {
          const currency = e.currency || 'CDF'
          expensesByCurrency[currency] = (expensesByCurrency[currency] || 0) + parseFloat(e.amount || 0)
        })

        // Extraire les soldes CDF et USD
        const balanceCDF = balance.find((b: any) => b.currency === 'CDF') || { balance: 0 }
        const balanceUSD = balance.find((b: any) => b.currency === 'USD') || { balance: 0 }

        return {
          totalPayments: payments.length,
          pendingCount: pending.length,
          completedPaymentsByCurrency: paymentsByCurrency,
          paidExpensesByCurrency: expensesByCurrency,
          balanceCDF: balanceCDF.balance || 0,
          balanceUSD: balanceUSD.balance || 0,
          expensesCount: expenses.length,
          studentsCount: students,
          paymentMethodsStats: paymentMethods,
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
        return {
          totalPayments: 0,
          pendingCount: 0,
          completedPaymentsByCurrency: {},
          paidExpensesByCurrency: {},
          balanceCDF: 0,
          balanceUSD: 0,
          expensesCount: 0,
          studentsCount: 0,
          paymentMethodsStats: [],
        }
      }
    },
  })

  const mainCards = [
    {
      title: 'Paiements en attente',
      value: stats?.pendingCount ?? 0,
      icon: CreditCard,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total paiements',
      value: stats?.totalPayments ?? 0,
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      title: 'Solde CDF',
      value: `${formatAmount(stats?.balanceCDF ?? 0)} CDF`,
      icon: Wallet,
      color: 'bg-green-500',
    },
    {
      title: 'Solde USD',
      value: `${formatAmount(stats?.balanceUSD ?? 0)} USD`,
      icon: Wallet,
      color: 'bg-emerald-500',
    },
    {
      title: 'Nombre d\'élèves',
      value: stats?.studentsCount ?? 0,
      icon: Users,
      color: 'bg-indigo-500',
    },
    {
      title: 'Dépenses enregistrées',
      value: stats?.expensesCount ?? 0,
      icon: DollarSign,
      color: 'bg-purple-500',
    },
  ]

  // Cartes pour les paiements effectués par devise
  const paymentCards = Object.entries(stats?.completedPaymentsByCurrency || {}).map(([currency, amount]) => ({
    title: `Paiements effectués (${currency})`,
    value: `${formatAmount(amount as number)} ${currency}`,
    icon: TrendingUp,
    color: 'bg-blue-600',
  }))

  // Cartes pour les dépenses effectuées par devise
  const expenseCards = Object.entries(stats?.paidExpensesByCurrency || {}).map(([currency, amount]) => ({
    title: `Dépenses effectuées (${currency})`,
    value: `${formatAmount(amount as number)} ${currency}`,
    icon: DollarSign,
    color: 'bg-red-500',
  }))

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Tableau de bord Comptable</h1>

      {/* Cartes principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {mainCards.map(({ title, value, icon: Icon, color }) => (
          <Card key={title} className="p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isLoading ? '...' : value}
                </p>
              </div>
              <div className={`${color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Paiements effectués par devise */}
      {paymentCards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Paiements effectués</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentCards.map(({ title, value, icon: Icon, color }) => (
              <Card key={title} className="p-6 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {isLoading ? '...' : value}
                    </p>
                  </div>
                  <div className={`${color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dépenses effectuées par devise */}
      {expenseCards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Dépenses effectuées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenseCards.map(({ title, value, icon: Icon, color }) => (
              <Card key={title} className="p-6 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {isLoading ? '...' : value}
                    </p>
                  </div>
                  <div className={`${color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques par méthode de paiement */}
      {stats?.paymentMethodsStats && stats.paymentMethodsStats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statistiques par méthode de paiement
          </h2>
          <Card className="p-6 dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Méthode de paiement
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Devise
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Montant total
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Nombre de paiements
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.paymentMethodsStats.map((stat: any, index: number) => (
                    <tr
                      key={`${stat.payment_method}-${stat.currency}-${index}`}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {stat.payment_method_display || stat.payment_method}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                        {stat.currency}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                        {formatAmount(stat.total_amount)} {stat.currency}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                        {stat.payment_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
