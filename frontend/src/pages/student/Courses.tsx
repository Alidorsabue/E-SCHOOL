import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { BookOpen, Play } from 'lucide-react'

export default function StudentCourses() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: async () => {
      const response = await api.get('/elearning/courses/')
      return response.data
    },
  })

  const courseList = courses?.results ?? courses ?? []
  const hasCourses = Array.isArray(courseList) && courseList.length > 0

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Cours</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
        ) : hasCourses ? (
          courseList.map((course: any) => (
            <Card key={course.id}>
              <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{course.subject_name}</span>
                {course.video_url && (
                  <a
                    href={course.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary text-sm flex items-center space-x-1"
                  >
                    <Play className="w-4 h-4" />
                    <span>Regarder</span>
                  </a>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Aucun cours disponible pour votre classe.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Les enseignants publient les cours dans l'espace e-learning.</p>
          </div>
        )}
      </div>
    </div>
  )
}
