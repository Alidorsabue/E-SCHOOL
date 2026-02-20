import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Plus, Check, X, Clock, UserCheck, Loader2, Calendar } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { showErrorToast, showSuccessToast } from '@/utils/toast'
import { sortClassesByLevel } from '@/utils/classLevel'

const attendanceSchema = z.object({
  school_class: z.number().min(1, 'La classe est requise'),
  date: z.string().min(1, 'La date est requise'),
  students: z.array(z.object({
    student: z.number(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  })).min(1, 'Sélectionnez au moins un élève'),
})

type AttendanceForm = z.infer<typeof attendanceSchema>

export default function TeacherAttendance() {
  const [showForm, setShowForm] = useState(false)
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [histClass, setHistClass] = useState<number | null>(null)
  const [histDateAfter, setHistDateAfter] = useState('')
  const [histDateBefore, setHistDateBefore] = useState('')
  const [summaryRequest, setSummaryRequest] = useState<{ school_class: number; period: string; date: string } | null>(null)
  const [summaryTodayOnly, setSummaryTodayOnly] = useState(false)
  const queryClient = useQueryClient()

  const todayStr = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      students: [],
    },
  })

  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes-my-titular'],
    queryFn: async () => {
      const res = await api.get('/schools/classes/my_titular/')
      return res.data
    },
  })
  const classes = useMemo(() => classesData?.results ?? [], [classesData])

  // Auto-sélection : 1 classe → celle-ci ; 2+ → la plus basse (1ère < 2ème < …)
  useEffect(() => {
    if (classes.length === 0 || selectedClass !== null) return
    const sorted = sortClassesByLevel(classes)
    const firstId = (sorted[0] as { id?: number })?.id
    if (firstId != null) setSelectedClass(firstId)
  }, [classes, selectedClass])

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', histClass, histDateAfter, histDateBefore],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (histClass) params.school_class = String(histClass)
      if (histDateAfter) params.date_after = histDateAfter
      if (histDateBefore) params.date_before = histDateBefore
      const res = await api.get('/academics/attendance/', { params })
      return res.data
    },
  })

  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['attendance-summary', summaryRequest?.school_class, summaryRequest?.period, summaryRequest?.date, summaryTodayOnly],
    queryFn: async () => {
      if (!summaryRequest?.school_class) return null
      const params = { ...summaryRequest }
      if (params.period === 'day') params.date = new Date().toISOString().split('T')[0]
      const res = await api.get('/academics/attendance/attendance_summary/', { params })
      return res.data
    },
    enabled: !!(summaryRequest?.school_class),
  })

  const { data: students, isLoading: isLoadingStudents, error: studentsError } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return { results: [] }
      try {
        const res = await api.get(`/accounts/students/?school_class=${selectedClass}`)
        const data = res.data
        if (Array.isArray(data)) return { results: data }
        return data || { results: [] }
      } catch (e) {
        console.error('Erreur chargement élèves:', e)
        return { results: [] }
      }
    },
    enabled: !!selectedClass,
    retry: 1,
  })

  const createMutation = useMutation({
    mutationFn: async (data: AttendanceForm) => {
      const promises = data.students.map((s) =>
        api.post('/academics/attendance/', {
          student: s.student,
          school_class: data.school_class,
          date: data.date,
          status: s.status,
        })
      )
      return Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
      showSuccessToast('Présences enregistrées avec succès')
      setShowForm(false)
      setSelectedClass(null)
      reset()
    },
    onError: (e: unknown) => showErrorToast(e, 'Erreur lors de l\'enregistrement des présences'),
  })

  const onSubmit = (data: AttendanceForm) => createMutation.mutate(data)

  const handleClassChange = (classId: string) => {
    const id = parseInt(classId, 10)
    setSelectedClass(id || null)
    setValue('students', [])
  }

  const toggleStudentStatus = (studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    const cur = watch('students') || []
    const i = cur.findIndex((s) => s.student === studentId)
    if (i >= 0) {
      const up = [...cur]
      up[i].status = status
      setValue('students', up)
    } else {
      setValue('students', [...cur, { student: studentId, status }])
    }
  }

  const getStudentStatus = (studentId: number) => {
    const cur = watch('students') || []
    return cur.find((s) => s.student === studentId)?.status ?? null
  }

  const getStatusBadge = (s: string) =>
    ({ PRESENT: 'badge-success', ABSENT: 'badge-danger', LATE: 'badge-warning', EXCUSED: 'badge-info' }[s] ?? 'badge-info')
  const getStatusLabel = (s: string) =>
    ({ PRESENT: 'Présent', ABSENT: 'Absent', LATE: 'En retard', EXCUSED: 'Excusé' }[s] ?? s)

  const hasTitularClasses = classes.length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Présences</h1>
        {hasTitularClasses && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Prendre la présence
          </button>
        )}
      </div>

      {!hasTitularClasses ? (
        <Card>
          <div className="py-12 text-center text-amber-700 dark:text-amber-300">
            <p className="font-medium">Vous n&apos;êtes titulaire d&apos;aucune classe.</p>
            <p className="text-sm mt-2">L&apos;administrateur peut vous désigner comme titulaire dans la fiche de chaque classe.</p>
          </div>
        </Card>
      ) : (
        <>
          {showForm && (
            <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Prendre la présence</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                La présence est prise <strong>une fois par jour</strong> par classe, selon le calendrier. Seuls les élèves de la classe sélectionnée sont affichés.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Classe <span className="text-red-500">*</span></label>
                    <select
                      {...register('school_class', { valueAsNumber: true })}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="input"
                    >
                      <option value="">Sélectionner une classe</option>
                      {classes.map((c: { id: number; name: string }) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.school_class && <p className="mt-1 text-sm text-red-600">{errors.school_class.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-red-500">*</span></label>
                    <input {...register('date')} type="date" className="input" />
                    {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                  </div>
                </div>

                {selectedClass && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Élèves de la classe <span className="text-red-500">*</span></label>
                    {isLoadingStudents ? (
                      <div className="p-4 text-center">
                        <Loader2 className="inline w-6 h-6 animate-spin text-primary-600" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Chargement des élèves...</p>
                      </div>
                    ) : studentsError ? (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">Erreur lors du chargement des élèves.</p>
                      </div>
                    ) : students?.results?.length ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {students.results.map((stu: { id: number; user_name?: string; user?: { first_name?: string; last_name?: string; middle_name?: string | null } }) => (
                            <div
                              key={stu.id}
                              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between bg-white dark:bg-gray-800"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {stu.user_name || [stu.user?.first_name, stu.user?.last_name, stu.user?.middle_name].filter(Boolean).join(' ') || 'Élève sans nom'}
                              </span>
                              <div className="flex gap-1">
                                {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => toggleStudentStatus(stu.id, st)}
                                    className={`p-1.5 rounded transition-colors ${
                                      getStudentStatus(stu.id) === st
                                        ? st === 'PRESENT' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                        : st === 'ABSENT' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                        : st === 'LATE' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                        : 'text-gray-400 hover:opacity-80'
                                    }`}
                                    title={getStatusLabel(st)}
                                  >
                                    {st === 'PRESENT' && <Check className="w-4 h-4" />}
                                    {st === 'ABSENT' && <X className="w-4 h-4" />}
                                    {st === 'LATE' && <Clock className="w-4 h-4" />}
                                    {st === 'EXCUSED' && <UserCheck className="w-4 h-4" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        {errors.students && <p className="mt-2 text-sm text-red-600">{errors.students.message}</p>}
                      </>
                    ) : (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">Aucun élève dans cette classe.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => { setShowForm(false); setSelectedClass(null); reset() }} className="btn btn-secondary">Annuler</button>
                  <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
                    {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer les présences'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          {/* Situation par semaine / mois (titulaire) */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Situation des présences par période
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Vue récapitulative pour tous les élèves de votre classe, par <strong>semaine</strong>, <strong>mois</strong> ou <strong>jour</strong> (aujourd&apos;hui).
            </p>
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classe</label>
                <select
                  className="input"
                  value={summaryRequest?.school_class && summaryRequest.school_class !== 0 ? summaryRequest.school_class : ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) { setSummaryRequest(null); return }
                    setSummaryRequest((p) => ({
                      school_class: Number(v),
                      period: summaryTodayOnly ? 'day' : (p?.period ?? 'week'),
                      date: summaryTodayOnly ? todayStr : (p?.date ?? todayStr),
                    }))
                  }}
                >
                  <option value="">Sélectionner</option>
                  {classes.map((c: { id: number; name: string }) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Période</label>
                <select
                  className="input disabled:opacity-60 disabled:cursor-not-allowed"
                  value={summaryTodayOnly ? 'day' : (summaryRequest?.period ?? 'week')}
                  onChange={(e) => setSummaryRequest((p) => (p ? { ...p, period: e.target.value } : null))}
                  disabled={summaryTodayOnly}
                >
                  <option value="week">Semaine</option>
                  <option value="month">Mois</option>
                  <option value="day">Jour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date (référence)</label>
                <input
                  type="date"
                  className="input disabled:opacity-60 disabled:cursor-not-allowed"
                  value={summaryTodayOnly ? todayStr : (summaryRequest?.date ?? todayStr)}
                  onChange={(e) => setSummaryRequest((p) => (p ? { ...p, date: e.target.value } : null))}
                  disabled={summaryTodayOnly}
                />
              </div>
              <label className="flex items-center gap-2 py-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={summaryTodayOnly}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setSummaryTodayOnly(checked)
                    if (checked) {
                      setSummaryRequest((p) => (p ? { ...p, period: 'day', date: todayStr } : { school_class: 0, period: 'day', date: todayStr }))
                    } else {
                      setSummaryRequest((p) => (p && p.school_class ? { ...p, period: 'week', date: todayStr } : null))
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aujourd&apos;hui</span>
              </label>
            </div>
            {loadingSummary ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
            ) : summaryData?.results?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Élève</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Présents</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Absents</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">En retard</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Excusés</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {summaryData.results.map((r: { student_id: number; student_name: string; present: number; absent: number; late: number; excused: number; total: number }) => (
                      <tr key={r.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{r.student_name}</td>
                        <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">{r.present}</td>
                        <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">{r.absent}</td>
                        <td className="px-4 py-2 text-right text-yellow-600 dark:text-yellow-400">{r.late}</td>
                        <td className="px-4 py-2 text-right text-blue-600 dark:text-blue-400">{r.excused}</td>
                        <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Période : {summaryData.period === 'day'
                    ? `${summaryData.date_after} (jour)`
                    : `${summaryData.date_after} → ${summaryData.date_before} (${summaryData.period === 'week' ? 'semaine' : 'mois'})`}
                </p>
              </div>
            ) : summaryRequest ? (
              <p className="py-6 text-center text-gray-500 dark:text-gray-400">
                Aucune donnée pour cette période ou cette classe.
              </p>
            ) : null}
          </Card>

          {/* Historique des présences */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historique des présences</h2>
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classe</label>
                <select className="input" value={histClass ?? ''} onChange={(e) => setHistClass(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Toutes</option>
                  {classes.map((c: { id: number; name: string }) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Du</label>
                <input type="date" className="input" value={histDateAfter} onChange={(e) => setHistDateAfter(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Au</label>
                <input type="date" className="input" value={histDateBefore} onChange={(e) => setHistDateBefore(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Élève</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr><td colSpan={3} className="px-6 py-4 text-center">Chargement...</td></tr>
                  ) : !attendance?.results?.length ? (
                    <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Aucune présence enregistrée</td></tr>
                  ) : (
                    attendance.results.map((att: { id: number; student_name: string; date: string; status: string }) => (
                      <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{att.student_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(att.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4">
                          <span className={`badge ${getStatusBadge(att.status)}`}>{getStatusLabel(att.status)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
