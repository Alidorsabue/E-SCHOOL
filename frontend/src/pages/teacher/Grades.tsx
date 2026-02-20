import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Search, Loader2 } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

/** Conforme bulletin RDC: 2 semestres, 4 périodes (Trav. journaliers), 2 examens par semestre. */
const SEMESTER_OPTIONS = [
  { value: 'S1', label: 'Premier semestre' },
  { value: 'S2', label: 'Second semestre' },
]

const PERIOD_OPTIONS: Record<string, { value: string; label: string; isExam: boolean }[]> = {
  S1: [
    { value: 's1_p1', label: '1ère P. (Interrogation)', isExam: false },
    { value: 's1_p2', label: '2ème P. (Interrogation)', isExam: false },
    { value: 's1_exam', label: 'Examen S1', isExam: true },
  ],
  S2: [
    { value: 's2_p3', label: '3ème P. (Interrogation)', isExam: false },
    { value: 's2_p4', label: '4ème P. (Interrogation)', isExam: false },
    { value: 's2_exam', label: 'Examen S2', isExam: true },
  ],
}

const S1_FIELDS = ['s1_p1', 's1_p2', 's1_exam']
const S2_FIELDS = ['s2_p3', 's2_p4', 's2_exam']

const currentYear = new Date().getFullYear()
const defaultAcademicYear = `${currentYear}-${currentYear + 1}`

export default function TeacherGrades() {
  const queryClient = useQueryClient()
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [searchStudent, setSearchStudent] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [semester, setSemester] = useState<'S1' | 'S2'>('S1')
  const [periodField, setPeriodField] = useState('s1_p1')
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear)
  const [subject, setSubject] = useState<number | null>(null)
  const [overrides, setOverrides] = useState<Record<number, Record<string, string>>>({})
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchStudent), 300)
    return () => clearTimeout(t)
  }, [searchStudent])

  useEffect(() => {
    const opts = PERIOD_OPTIONS[semester]
    if (opts && !opts.some((p) => p.value === periodField)) {
      setPeriodField(opts[0].value)
    }
  }, [semester, periodField])

  const { data: classes } = useQuery({
    queryKey: ['teacher-classes-my-grades'],
    queryFn: async () => {
      const res = await api.get('/schools/classes/my_grades_classes/')
      return res.data
    },
  })

  const { data: classSubjectsData } = useQuery({
    queryKey: ['class-subjects', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return { results: [] }
      const res = await api.get('/schools/class-subjects/', { params: { school_class: selectedClass } })
      return res.data
    },
    enabled: !!selectedClass,
  })

  const { data: academicYearsAvailable } = useQuery({
    queryKey: ['academic-years-available'],
    queryFn: async () => {
      const res = await api.get('/academics/academic-years/available/')
      return res.data as { years?: string[]; current?: string | null }
    },
  })

  const selectedClassObj = useMemo(
    () => (classes?.results || []).find((c: any) => c.id === selectedClass),
    [classes, selectedClass]
  )

  // Années : endpoint available (AcademicYear + SchoolClass + GradeBulletin). Si vide → saisie libre (datalist vide).
  const yearStrings = useMemo(() => {
    const list = academicYearsAvailable?.years ?? []
    return Array.isArray(list) ? [...list] : []
  }, [academicYearsAvailable?.years])

  // Par défaut : année de la classe (si classe choisie), sinon current de l'API, sinon première de la liste, sinon defaultAcademicYear.
  useEffect(() => {
    const fromClass = selectedClassObj?.academic_year
    if (fromClass) {
      setAcademicYear(fromClass)
      return
    }
    if (!yearStrings.length) return
    const curName = academicYearsAvailable?.current ?? null
    if (!yearStrings.includes(academicYear)) {
      setAcademicYear(curName || yearStrings[0] || defaultAcademicYear)
      return
    }
    if (academicYear === defaultAcademicYear && curName) setAcademicYear(curName)
  }, [academicYearsAvailable?.current, selectedClassObj?.academic_year, academicYear, yearStrings])

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', selectedClass, searchDebounced],
    queryFn: async () => {
      if (!selectedClass) return { results: [] }
      const params: Record<string, string> = { school_class: String(selectedClass) }
      if (searchDebounced.trim()) params.search = searchDebounced.trim()
      const res = await api.get('/accounts/students/', { params })
      return res.data
    },
    enabled: !!selectedClass,
  })

  const canFetchGrades = !!(selectedClass && subject && academicYear.trim())
  const { data: gradesData } = useQuery({
    queryKey: ['grade-bulletins', selectedClass, subject, academicYear],
    queryFn: async () => {
      const params: Record<string, string> = {
        school_class: String(selectedClass),
        subject: String(subject),
        academic_year: academicYear.trim(),
        page_size: '200',
      }
      const res = await api.get('/academics/grade-bulletins/', { params })
      return res.data
    },
    enabled: canFetchGrades,
  })

  const saveGradeMutation = useMutation({
    mutationFn: async ({
      studentId,
      gradeId,
      field,
      value,
    }: {
      studentId: number
      gradeId?: number
      field: string
      value: number
    }) => {
      if (gradeId) {
        return api.patch(`/academics/grade-bulletins/${gradeId}/`, { [field]: value })
      }
      return api.post('/academics/grade-bulletins/', {
        student: studentId,
        subject: subject!,
        academic_year: academicYear.trim(),
        school_class: selectedClass,
        [field]: value,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['grade-bulletins'] })
      setSavingStudentId(null)
      setOverrides((o) => {
        const next = { ...o }
        if (next[variables.studentId]) {
          next[variables.studentId] = { ...next[variables.studentId] }
          delete next[variables.studentId][variables.field]
          if (Object.keys(next[variables.studentId]).length === 0) delete next[variables.studentId]
        }
        return next
      })
      showSuccessToast('Note enregistrée')
    },
    onError: (err: any) => {
      setSavingStudentId(null)
      if (err?.response?.data) console.error('POST/PATCH grade-bulletins:', err.response.data)
      showErrorToast(err, "Erreur lors de l'enregistrement")
    },
  })

  const students = useMemo(() => studentsData?.results ?? [], [studentsData])
  const gradesList = useMemo(() => gradesData?.results ?? [], [gradesData])
  const gradesByStudent = useMemo(() => {
    const m: Record<number, any> = {}
    gradesList.forEach((g: any) => {
      m[g.student] = g
    })
    return m
  }, [gradesList])

  const classSubjectsList = useMemo(() => (classSubjectsData?.results ?? []) as any[], [classSubjectsData])

  // Réinitialiser la matière si elle n'est plus dans les matières de la classe (ex. suppression par le titulaire)
  useEffect(() => {
    if (subject && selectedClass && classSubjectsList.length > 0 && !classSubjectsList.some((cs: any) => cs.subject === subject)) {
      setSubject(null)
    }
  }, [classSubjectsList, selectedClass, subject])

  const classSubjectPeriodMap = useMemo(() => {
    const m: Record<number, number> = {}
    ;(classSubjectsData?.results ?? []).forEach((cs: any) => { m[cs.subject] = cs.period_max })
    return m
  }, [classSubjectsData])
  const periodMax = (subject ? classSubjectPeriodMap[subject] : null) ?? 20
  const examMax = periodMax * 2

  const periodOpt = useMemo(() => {
    const arr = PERIOD_OPTIONS[semester] || []
    return arr.find((p) => p.value === periodField)
  }, [semester, periodField])
  const inputMax = periodOpt?.isExam ? examMax : periodMax

  const canEdit = !!(subject && academicYear.trim())

  const getGrade = (studentId: number) => gradesByStudent[studentId] ?? null

  const getDisplayValue = (studentId: number) => {
    const g = getGrade(studentId)
    const ov = overrides[studentId]?.[periodField]
    if (ov !== undefined) return ov
    const v = g?.[periodField]
    return v != null ? String(v) : ''
  }

  const getTotalSemester = (studentId: number) => {
    const g = getGrade(studentId)
    const ov = overrides[studentId] || {}
    const fields = semester === 'S1' ? S1_FIELDS : S2_FIELDS
    let sum = 0
    for (const f of fields) {
      const v = ov[f] !== undefined ? parseFloat(ov[f]) : (g?.[f] != null ? parseFloat(String(g[f])) : null)
      if (v != null && !isNaN(v)) sum += v
    }
    return sum > 0 ? sum.toFixed(2) : '-'
  }

  const handleBlur = (studentId: number) => {
    if (!canEdit) return
    const g = getGrade(studentId)
    const raw = getDisplayValue(studentId)
    const num = parseFloat(raw)
    const value = isNaN(num) ? 0 : Math.min(inputMax, Math.max(0, num))

    if (!g && value === 0) return

    const prev = g?.[periodField] != null ? parseFloat(String(g[periodField])) : null
    if (prev === value) return

    setSavingStudentId(studentId)
    saveGradeMutation.mutate({
      studentId,
      gradeId: g?.id,
      field: periodField,
      value,
    })
  }

  const handleChange = (studentId: number, value: string) => {
    setOverrides((o) => {
      const next = { ...o }
      next[studentId] = { ...(o[studentId] || {}), [periodField]: value }
      return next
    })
  }

  const studentName = (s: any) =>
    s.user_name || [s.user?.first_name, s.user?.last_name, s.user?.middle_name].filter(Boolean).join(' ') || `Élève #${s.id}`

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Gestion des Notes (Bulletin RDC)
      </h1>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtres</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Classe <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass ?? ''}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null
                setSelectedClass(v)
                setSubject(null)
              }}
              className="input"
            >
              <option value="">Sélectionner une classe</option>
              {(classes?.results || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recherche élève</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Nom, prénom, matricule..."
                className="input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semestre</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value as 'S1' | 'S2')} className="input">
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Période</label>
            <select value={periodField} onChange={(e) => setPeriodField(e.target.value)} className="input">
              {(PERIOD_OPTIONS[semester] || []).map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Année scolaire</label>
            <input
              type="text"
              list="academic-years-datalist-grades"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="ex. 2024-2025 (saisie libre si aucune suggestion)"
              className="input"
            />
            <datalist id="academic-years-datalist-grades">
              {yearStrings.map((y) => (
                <option key={y} value={y} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Matière</label>
            <select
              value={subject ?? ''}
              onChange={(e) => setSubject(e.target.value ? Number(e.target.value) : null)}
              className="input"
              disabled={!selectedClass}
            >
              <option value="">
                {selectedClass
                  ? classSubjectsList.length === 0
                    ? 'Aucune matière définie pour cette classe'
                    : 'Sélectionner une matière'
                  : 'Sélectionnez d\'abord une classe'}
              </option>
              {classSubjectsList.map((cs: any) => (
                <option key={cs.id} value={cs.subject}>
                  {cs.subject_name}{cs.subject_code ? ` (${cs.subject_code})` : ''} — max/période: {cs.period_max ?? 20}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClass && !canEdit && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            {classSubjectsList.length === 0
              ? 'Aucune matière définie pour cette classe. Le titulaire peut les ajouter dans « Matières de la classe » (fiche de la classe en admin).'
              : 'Sélectionnez l\'année scolaire et la matière pour saisir les notes.'}
          </p>
        )}
      </Card>

      <Card>
        {(classes?.results || []).length === 0 ? (
          <div className="py-12 text-center text-amber-700 dark:text-amber-300">
            <p className="font-medium">Vous n&apos;avez accès à aucune classe pour la saisie des notes.</p>
            <p className="text-sm mt-2">Vous pouvez saisir les notes si vous êtes <strong>titulaire</strong> d&apos;une classe ou si le titulaire vous a <strong>assigné au moins une matière</strong> dans « Matières par classe ». L&apos;administrateur peut vous désigner comme titulaire ; le titulaire peut vous attribuer une matière dans la gestion des matières de sa classe.</p>
          </div>
        ) : !selectedClass ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Sélectionnez une classe pour afficher les élèves et saisir les notes.
          </div>
        ) : loadingStudents ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Aucun élève dans cette classe {searchDebounced ? 'pour cette recherche' : ''}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Élève</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Note ({periodOpt?.label ?? periodField}) /{inputMax}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total {semester === 'S1' ? 'S1' : 'S2'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student: any) => {
                  const val = getDisplayValue(student.id)
                  const totalSem = getTotalSemester(student.id)
                  const saving = savingStudentId === student.id
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {studentName(student)}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={inputMax}
                          value={val}
                          onChange={(e) => handleChange(student.id, e.target.value)}
                          onBlur={() => handleBlur(student.id)}
                          disabled={!canEdit || saving}
                          className="input w-24 py-1.5 text-center"
                        />
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : totalSem}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
