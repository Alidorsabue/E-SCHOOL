import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { User, Plus, X, Edit2, Save } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

const teacherSchema = z.object({
  username: z.string().min(1, 'Le nom d\'utilisateur est requis'),
  email: z.string().email('Email invalide'),
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  password2: z.string().min(1, 'La confirmation du mot de passe est requise'),
  employee_id: z.string().min(1, 'Le matricule est requis'),
  specialization: z.string().optional(),
  hire_date: z.string().min(1, 'La date d\'embauche est requise'),
  salary: z.number().optional(),
}).refine((data) => data.password === data.password2, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password2'],
})

const teacherEditSchema = z.object({
  username: z.string().min(1, 'Le nom d\'utilisateur est requis'),
  email: z.string().email('Email invalide'),
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional().or(z.literal('')),
  password2: z.string().optional(),
  employee_id: z.string().min(1, 'Le matricule est requis'),
  specialization: z.string().optional(),
  hire_date: z.string().min(1, 'La date d\'embauche est requise'),
  salary: z.number().optional(),
}).refine((data) => !data.password || data.password === '' || data.password === data.password2, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password2'],
})

type TeacherForm = z.infer<typeof teacherSchema>
type TeacherEditForm = z.infer<typeof teacherEditSchema>

export default function AdminTeachers() {
  const [showForm, setShowForm] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
  })
  const { register: registerEdit, handleSubmit: handleSubmitEdit, formState: { errors: errorsEdit }, reset: resetEdit, setValue: setValueEdit } = useForm<TeacherEditForm>({
    resolver: zodResolver(teacherEditSchema),
  })

  const { data: teachers, isLoading, error } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/auth/teachers/')
      return response.data
    },
    retry: 1,
  })

  const createMutation = useMutation({
    mutationFn: async (data: TeacherForm) => {
      // Créer d'abord l'utilisateur
      const userData = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        password: data.password,
        password2: data.password2,
        role: 'TEACHER',
      }
      const userResponse = await api.post('/auth/users/register/', userData)
      const userId = userResponse.data.id
      
      // Créer ensuite le profil enseignant
      const teacherData = {
        user_id: userId,
        employee_id: data.employee_id,
        specialization: data.specialization,
        hire_date: data.hire_date,
        salary: data.salary,
      }
      return api.post('/auth/teachers/', teacherData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      showSuccessToast('Enseignant créé avec succès')
      setShowForm(false)
      reset()
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors de la création de l\'enseignant')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ teacher, data }: { teacher: any; data: TeacherEditForm }) => {
      const userId = teacher?.user?.id
      const teacherPayload = {
        employee_id: data.employee_id,
        specialization: data.specialization || '',
        hire_date: data.hire_date,
        salary: data.salary ?? null,
      }
      const userPayload: Record<string, unknown> = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || '',
      }
      if (data.password && data.password.trim().length >= 6) {
        userPayload.password = data.password
      }
      await api.patch(`/auth/teachers/${teacher.id}/`, teacherPayload)
      if (userId) {
        await api.patch(`/auth/users/${userId}/`, userPayload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      showSuccessToast('Enseignant mis à jour avec succès')
      setSelectedTeacher(null)
      setIsEditMode(false)
      resetEdit()
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors de la mise à jour de l\'enseignant')
    },
  })

  const onSubmit = (data: TeacherForm) => {
    createMutation.mutate(data)
  }

  const onEditSubmit = (data: TeacherEditForm) => {
    if (selectedTeacher) updateMutation.mutate({ teacher: selectedTeacher, data })
  }

  const openDetail = (teacher: any) => {
    setSelectedTeacher(teacher)
    setIsEditMode(false)
  }

  const openEdit = () => {
    setIsEditMode(true)
    const u = selectedTeacher?.user || {}
    const h = selectedTeacher?.hire_date
    setValueEdit('username', u.username || '')
    setValueEdit('email', u.email || '')
    setValueEdit('first_name', u.first_name || '')
    setValueEdit('last_name', u.last_name || '')
    setValueEdit('phone', u.phone || '')
    setValueEdit('employee_id', selectedTeacher?.employee_id || '')
    setValueEdit('specialization', selectedTeacher?.specialization || '')
    setValueEdit('hire_date', (typeof h === 'string' ? h : h?.toString?.()?.slice(0, 10)) || '')
    setValueEdit('salary', selectedTeacher?.salary != null ? Number(selectedTeacher.salary) : undefined)
  }

  const closeModal = () => {
    setSelectedTeacher(null)
    setIsEditMode(false)
    resetEdit()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Gestion des Enseignants</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouvel enseignant
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Nouvel enseignant</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('username')}
                  className="input"
                  placeholder="Nom d'utilisateur"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="input"
                  placeholder="Email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('first_name')}
                  className="input"
                  placeholder="Prénom"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('last_name')}
                  className="input"
                  placeholder="Nom"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  {...register('phone')}
                  className="input"
                  placeholder="Téléphone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="input"
                  placeholder="Mot de passe"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('password2')}
                  type="password"
                  className="input"
                  placeholder="Confirmer le mot de passe"
                />
                {errors.password2 && (
                  <p className="mt-1 text-sm text-red-600">{errors.password2.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matricule <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('employee_id')}
                  className="input"
                  placeholder="Matricule"
                />
                {errors.employee_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialisation
                </label>
                <input
                  {...register('specialization')}
                  className="input"
                  placeholder="Spécialisation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'embauche <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('hire_date')}
                  type="date"
                  className="input"
                />
                {errors.hire_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.hire_date.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salaire
                </label>
                <input
                  {...register('salary', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="Salaire"
                />
              </div>
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
                {createMutation.isPending ? 'Création...' : 'Créer l\'enseignant'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">Chargement...</div>
        ) : error ? (
          <div className="col-span-full text-center py-12 text-red-600 dark:text-red-400">
            Erreur lors du chargement des enseignants
          </div>
        ) : !teachers?.results || teachers?.results?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            Aucun enseignant trouvé
          </div>
        ) : (
          teachers?.results?.map((teacher: any) => (
            <Card
              key={teacher.id}
              onClick={() => openDetail(teacher)}
              className="cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary-200 dark:hover:ring-primary-800 transition-all"
            >
              <div className="flex items-center space-x-4">
                {teacher.user?.profile_picture ? (
                  <img
                    src={teacher.user.profile_picture}
                    alt={(teacher.user?.first_name || '') + ' ' + (teacher.user?.last_name || '')}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {teacher.user?.first_name} {teacher.user?.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{teacher.employee_id}</p>
                  {teacher.specialization && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">{teacher.specialization}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal détail / modification */}
      {selectedTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Modifier l\'enseignant' : 'Fiche enseignant'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isEditMode ? (
                <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d&apos;utilisateur *</label>
                      <input {...registerEdit('username')} className="input w-full" />
                      {errorsEdit.username && <p className="mt-1 text-sm text-red-600">{errorsEdit.username.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                      <input {...registerEdit('email')} type="email" className="input w-full" />
                      {errorsEdit.email && <p className="mt-1 text-sm text-red-600">{errorsEdit.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
                      <input {...registerEdit('first_name')} className="input w-full" />
                      {errorsEdit.first_name && <p className="mt-1 text-sm text-red-600">{errorsEdit.first_name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                      <input {...registerEdit('last_name')} className="input w-full" />
                      {errorsEdit.last_name && <p className="mt-1 text-sm text-red-600">{errorsEdit.last_name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                      <input {...registerEdit('phone')} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Matricule *</label>
                      <input {...registerEdit('employee_id')} className="input w-full" />
                      {errorsEdit.employee_id && <p className="mt-1 text-sm text-red-600">{errorsEdit.employee_id.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spécialisation</label>
                      <input {...registerEdit('specialization')} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date d&apos;embauche *</label>
                      <input {...registerEdit('hire_date')} type="date" className="input w-full" />
                      {errorsEdit.hire_date && <p className="mt-1 text-sm text-red-600">{errorsEdit.hire_date.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salaire</label>
                      <input {...registerEdit('salary', { valueAsNumber: true })} type="number" step="0.01" className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                      <input {...registerEdit('password')} type="password" className="input w-full" placeholder="••••••••" />
                      {errorsEdit.password && <p className="mt-1 text-sm text-red-600">{errorsEdit.password.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer le mot de passe</label>
                      <input {...registerEdit('password2')} type="password" className="input w-full" placeholder="••••••••" />
                      {errorsEdit.password2 && <p className="mt-1 text-sm text-red-600">{errorsEdit.password2.message}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={() => { setIsEditMode(false); resetEdit(); }} className="btn btn-secondary">
                      Annuler
                    </button>
                    <button type="submit" disabled={updateMutation.isPending} className="btn btn-primary flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    {selectedTeacher.user?.profile_picture ? (
                      <img src={selectedTeacher.user.profile_picture} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                        <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedTeacher.user?.first_name} {selectedTeacher.user?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTeacher.employee_id}</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-3 text-sm">
                    <div><dt className="text-gray-500 dark:text-gray-400">Email</dt><dd className="font-medium text-gray-900 dark:text-white">{selectedTeacher.user?.email || '-'}</dd></div>
                    <div><dt className="text-gray-500 dark:text-gray-400">Téléphone</dt><dd className="font-medium text-gray-900 dark:text-white">{selectedTeacher.user?.phone || '-'}</dd></div>
                    <div><dt className="text-gray-500 dark:text-gray-400">Spécialisation</dt><dd className="font-medium text-gray-900 dark:text-white">{selectedTeacher.specialization || '-'}</dd></div>
                    <div><dt className="text-gray-500 dark:text-gray-400">Date d&apos;embauche</dt><dd className="font-medium text-gray-900 dark:text-white">{selectedTeacher.hire_date ? new Date(selectedTeacher.hire_date).toLocaleDateString('fr-FR') : '-'}</dd></div>
                    <div><dt className="text-gray-500 dark:text-gray-400">Salaire</dt><dd className="font-medium text-gray-900 dark:text-white">{selectedTeacher.salary != null ? `${Number(selectedTeacher.salary).toLocaleString('fr-FR')}` : '-'}</dd></div>
                  </dl>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={openEdit} className="btn btn-primary flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      Modifier les informations
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
