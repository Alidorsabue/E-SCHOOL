import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

const courseSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  subject: z.number().min(1, 'La matière est requise'),
  school_class: z.number().min(1, 'La classe est requise'),
  teacher: z.number().min(1, 'L\'enseignant est requis'),
  academic_year: z.string().min(1, 'L\'année scolaire est requise'),
  content: z.string().min(1, 'Le contenu est requis'),
  video_url: z.string().url('URL invalide').optional().or(z.literal('')),
  is_published: z.boolean().default(false),
})

type CourseForm = z.infer<typeof courseSchema>

export default function AdminElearning() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      is_published: false,
    },
  })

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['elearning-courses'],
    queryFn: async () => {
      const response = await api.get('/elearning/courses/')
      return response.data
    },
    retry: 1,
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/schools/subjects/')
      return response.data
    },
  })

  const { data: classes } = useQuery({
    queryKey: ['school-classes'],
    queryFn: async () => {
      const response = await api.get('/schools/classes/')
      return response.data
    },
  })

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/auth/teachers/')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CourseForm) => api.post('/elearning/courses/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elearning-courses'] })
      showSuccessToast('Cours créé avec succès')
      setShowForm(false)
      reset()
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors de la création du cours')
    },
  })

  const onSubmit = (data: CourseForm) => {
    createMutation.mutate(data)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion E-learning</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau cours
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Nouveau cours</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  className="input"
                  placeholder="Titre du cours"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matière <span className="text-red-500">*</span>
                </label>
                <select {...register('subject', { valueAsNumber: true })} className="input">
                  <option value="">Sélectionner une matière</option>
                  {subjects?.results?.map((subject: any) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classe <span className="text-red-500">*</span>
                </label>
                <select {...register('school_class', { valueAsNumber: true })} className="input">
                  <option value="">Sélectionner une classe</option>
                  {classes?.results?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                {errors.school_class && (
                  <p className="mt-1 text-sm text-red-600">{errors.school_class.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enseignant <span className="text-red-500">*</span>
                </label>
                <select {...register('teacher', { valueAsNumber: true })} className="input">
                  <option value="">Sélectionner un enseignant</option>
                  {teachers?.results?.map((teacher: any) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user?.first_name} {teacher.user?.last_name}
                    </option>
                  ))}
                </select>
                {errors.teacher && (
                  <p className="mt-1 text-sm text-red-600">{errors.teacher.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année scolaire <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('academic_year')}
                  className="input"
                  placeholder="2024-2025"
                />
                {errors.academic_year && (
                  <p className="mt-1 text-sm text-red-600">{errors.academic_year.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL vidéo
                </label>
                <input
                  {...register('video_url')}
                  type="url"
                  className="input"
                  placeholder="https://..."
                />
                {errors.video_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.video_url.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  {...register('is_published')}
                  type="checkbox"
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium text-gray-700">
                  Publié
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                className="input"
                rows={3}
                placeholder="Description du cours"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('content')}
                className="input"
                rows={6}
                placeholder="Contenu du cours"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  reset()
                }}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary"
              >
                {createMutation.isPending ? 'Création...' : 'Créer le cours'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Cours</h2>
          <div className="text-3xl font-bold text-primary-600">
            {courses?.results?.length || 0}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold mb-4">Cours publiés</h2>
          <div className="text-3xl font-bold text-green-600">
            {courses?.results?.filter((c: any) => c.is_published)?.length || 0}
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Matière</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Enseignant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">Chargement...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-600">
                    Erreur lors du chargement des cours
                  </td>
                </tr>
              ) : !courses?.results || courses?.results?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucun cours trouvé
                  </td>
                </tr>
              ) : (
                courses?.results?.map((course: any) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.subject_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.school_class_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.teacher_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.is_published ? (
                        <span className="badge badge-success">Publié</span>
                      ) : (
                        <span className="badge badge-warning">Brouillon</span>
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
