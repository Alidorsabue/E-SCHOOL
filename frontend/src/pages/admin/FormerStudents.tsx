import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Search, Users, GraduationCap } from 'lucide-react'
import { useState, useMemo } from 'react'

export default function AdminFormerStudents() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['former-students'],
    queryFn: async () => {
      const res = await api.get('/accounts/students/', {
        params: { is_former_student: 'true', page_size: 500 },
      })
      return res.data
    },
  })

  const list = useMemo(() => (data?.results ?? []) as any[], [data])
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (s: any) =>
        (s.user_name || '').toLowerCase().includes(q) ||
        (s.student_id || '').toLowerCase().includes(q) ||
        (s.graduation_year || '').toLowerCase().includes(q) ||
        (s.user?.email || '').toLowerCase().includes(q)
    )
  }, [list, searchQuery])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <GraduationCap className="w-8 h-8" />
        Anciens élèves
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Élèves sortis de l&apos;école (année terminale avec T.G. ≥50% ou autre).
      </p>

      <Card>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, année de sortie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
        ) : error ? (
          <div className="py-12 text-center text-red-600 dark:text-red-400">
            Erreur lors du chargement des anciens élèves.
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {list.length === 0
                ? 'Aucun ancien élève enregistré.'
                : `Aucun résultat pour « ${searchQuery} ».`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Matricule</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Année de sortie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Contact</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{s.student_id ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{(s.user_name ?? [s.user?.first_name, s.user?.last_name, s.user?.middle_name].filter(Boolean).join(' ')) || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{s.graduation_year ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{s.user?.email ?? s.user?.phone ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
