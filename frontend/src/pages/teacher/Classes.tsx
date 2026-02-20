import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Users, BookOpen, X, User, Mail, Phone } from 'lucide-react'

export default function TeacherClasses() {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedClassName, setSelectedClassName] = useState<string>('')

  const { data: classes, isLoading } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: async () => {
      const response = await api.get('/schools/classes/')
      return response.data
    },
  })

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/accounts/students/')
      return response.data
    },
  })

  // Récupérer les élèves de la classe sélectionnée
  const { data: classStudents, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-students', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return { results: [] }
      const response = await api.get(`/accounts/students/?school_class=${selectedClassId}`)
      return response.data
    },
    enabled: !!selectedClassId,
  })

  const getStudentsCount = (classId: number) => {
    if (!students?.results) return 0
    return students.results.filter((s: any) => s.school_class === classId).length
  }

  const handleClassClick = (classItem: any) => {
    setSelectedClassId(classItem.id)
    setSelectedClassName(classItem.name)
  }

  const handleCloseModal = () => {
    setSelectedClassId(null)
    setSelectedClassName('')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Classes</h1>

      {isLoading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.results?.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Aucune classe assignée. Contactez l'administrateur.
              </p>
            </Card>
          ) : (
            classes?.results?.map((classItem: any) => (
              <Card 
                key={classItem.id} 
                className="p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => handleClassClick(classItem)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {classItem.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {classItem.level} - {classItem.grade}
                      {classItem.section_name && ` - Section ${classItem.section_name}`}
                    </p>
                  </div>
                  <BookOpen className="w-8 h-8 text-primary-600" />
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{getStudentsCount(classItem.id)} élèves</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Capacité: {classItem.capacity}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Année: {classItem.academic_year}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modale pour afficher les élèves de la classe */}
      {selectedClassId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Élèves de la classe : {selectedClassName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {classStudents?.results?.length || 0} élève(s) inscrit(s)
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {isLoadingStudents ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">Chargement des élèves...</p>
                </div>
              ) : !classStudents?.results || classStudents.results.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Aucun élève inscrit dans cette classe
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classStudents.results.map((student: any) => (
                    <Card 
                      key={student.id} 
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {student.user_name || [student.user?.first_name, student.user?.last_name, student.user?.middle_name].filter(Boolean).join(' ') || 'Élève sans nom'}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {student.student_id && (
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">ID:</span>
                                <span>{student.student_id}</span>
                              </div>
                            )}
                            {student.user?.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{student.user.email}</span>
                              </div>
                            )}
                            {student.user?.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4" />
                                <span>{student.user.phone}</span>
                              </div>
                            )}
                            {student.enrollment_date && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                Inscrit le: {new Date(student.enrollment_date).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
