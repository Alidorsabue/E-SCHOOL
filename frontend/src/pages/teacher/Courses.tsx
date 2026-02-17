import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Plus, BookOpen, Users, Video, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

const courseSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  subject: z.number().min(1, 'La matière est requise'),
  school_class: z.number().min(1, 'La classe est requise'),
  academic_year: z.string().min(1, 'L\'année académique est requise'),
  content: z.string().min(1, 'Le contenu est requis'),
  video_url: z.string().url('URL invalide').optional().or(z.literal('')),
  is_published: z.boolean().default(false),
  due_date: z.string().optional(),
})

type CourseForm = z.infer<typeof courseSchema>

export default function TeacherCourses() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      is_published: false,
      video_url: '',
      due_date: '',
    },
  })

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
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

  const createMutation = useMutation({
    mutationFn: async (data: CourseForm) => {
      // Préparer les données pour l'API
      const payload: any = {
        title: data.title,
        description: data.description,
        subject: data.subject,
        school_class: data.school_class,
        academic_year: data.academic_year,
        content: data.content,
        is_published: data.is_published,
      }
      
      // Ajouter les champs optionnels seulement s'ils sont remplis
      if (data.video_url && data.video_url.trim() !== '') {
        payload.video_url = data.video_url
      }
      
      if (data.due_date && data.due_date.trim() !== '') {
        // Convertir la date locale en format ISO pour le backend
        const date = new Date(data.due_date)
        payload.due_date = date.toISOString()
      }
      
      return api.post('/elearning/courses/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Cours</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau cours</span>
        </button>
      </div>

      {showForm && (
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Nouveau cours</h2>
            <button
              onClick={() => {
                setShowForm(false)
                reset()
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Année académique <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('academic_year')}
                  className="input"
                  placeholder="Ex: 2024-2025"
                />
                {errors.academic_year && (
                  <p className="mt-1 text-sm text-red-600">{errors.academic_year.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL vidéo
                </label>
                <input
                  {...register('video_url')}
                  type="url"
                  className="input"
                  placeholder="https://exemple.com/video"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date limite
                </label>
                <input
                  {...register('due_date')}
                  type="datetime-local"
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('content')}
                className="input"
                rows={6}
                placeholder="Contenu détaillé du cours"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('is_published')}
                  type="checkbox"
                  className="checkbox"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Publier immédiatement</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Création...' : 'Créer le cours'}
              </button>
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
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des cours...</p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="text-center py-12 text-red-600">
            Erreur lors du chargement des cours
          </div>
        </Card>
      ) : !courses?.results || courses?.results?.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Aucun cours trouvé</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.results?.map((course: any) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                  {course.title}
                </h3>
                {!course.is_published && (
                  <span className="badge badge-warning ml-2">Brouillon</span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {course.description}
              </p>
              
              <div className="space-y-2 mb-4">
                {course.class_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{course.class_name}</span>
                  </div>
                )}
                {course.subject_name && (
                  <div className="text-sm">
                    <span className="badge badge-info">{course.subject_name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                {course.video_url && (
                  <span className="badge badge-info flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Vidéo
                  </span>
                )}
                {course.teacher_name && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {course.teacher_name}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
