import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'

export default function ParentGrades() {
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)

  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const response = await api.get('/auth/students/parent_dashboard/')
      return response.data
    },
  })

  const { data: grades, isLoading, error } = useQuery({
    queryKey: ['parent-grades', selectedStudent],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {}
        if (selectedStudent) {
          params['student'] = selectedStudent.toString()
        }
        const response = await api.get('/academics/grades/', { params })
        console.log('Grades response:', response.data)
        return response.data
      } catch (error: any) {
        console.error('Erreur lors du chargement des notes:', error)
        console.error('Response:', error?.response?.data)
        throw error
      }
    },
    retry: 1,
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Notes de mes enfants</h1>

      {children && children.length > 0 && (
        <Card className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filtrer par enfant
          </label>
          <select
            value={selectedStudent || ''}
            onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
            className="input max-w-xs"
          >
            <option value="">Tous les enfants</option>
            {children.map((child: any) => (
              <option key={child.identity.id} value={child.identity.id}>
                {child.identity.user?.first_name} {child.identity.user?.last_name} - {child.identity.student_id}
              </option>
            ))}
          </select>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Matière</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Trimestre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">Chargement...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-red-600 dark:text-red-400">
                    Erreur lors du chargement des notes. Veuillez réessayer plus tard.
                  </td>
                </tr>
              ) : !grades?.results || grades.results.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    <div className="flex flex-col items-center space-y-2">
                      <p>Aucune note disponible pour le moment.</p>
                      {selectedStudent && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Aucune note trouvée pour cet enfant.
                        </p>
                      )}
                      {!selectedStudent && children && children.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Essayez de sélectionner un enfant spécifique dans le filtre ci-dessus.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                grades.results.map((grade: any) => (
                  <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {grade.student_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {grade.subject_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {grade.term === 'T1' ? 'Trimestre 1' : grade.term === 'T2' ? 'Trimestre 2' : grade.term === 'T3' ? 'Trimestre 3' : grade.term}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {grade.total_score ? `${grade.total_score}/20` : 'N/A'}
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
