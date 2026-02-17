import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Plus, Video, FileText } from 'lucide-react'

export default function TeacherElearning() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: async () => {
      const response = await api.get('/elearning/courses/')
      return response.data
    },
  })

  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: async () => {
      const response = await api.get('/elearning/assignments/')
      return response.data
    },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">E-learning</h1>

      <div className="space-y-8">
        {/* Cours */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Mes Cours</h2>
            <button className="btn btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nouveau cours</span>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.results?.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Aucun cours disponible</p>
                </Card>
              ) : (
                courses?.results?.map((course: any) => (
                  <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {course.title}
                      </h3>
                      {course.video_url && (
                        <Video className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{course.subject_name}</span>
                      <span className="badge badge-info">{course.school_class_name}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Devoirs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Devoirs</h2>
            <button className="btn btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nouveau devoir</span>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments?.results?.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Aucun devoir disponible</p>
                </Card>
              ) : (
                assignments?.results?.map((assignment: any) => (
                  <Card key={assignment.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {assignment.title}
                      </h3>
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {assignment.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Échéance: {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="badge badge-info">{assignment.total_points} pts</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
