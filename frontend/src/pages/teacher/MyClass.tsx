import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Search, Loader2, Users, TrendingUp, ChevronDown, ChevronUp, GraduationCap, RefreshCw } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { showErrorToast, showSuccessToast } from '@/utils/toast'
import { sortClassesByLevel } from '@/utils/classLevel'

const currentYear = new Date().getFullYear()
const defaultAcademicYear = `${currentYear}-${currentYear + 1}`

/** Colonnes du bulletin RDC. mult = coefficient de la note de base (période=1, examen=2, semestre=4, T.G.=8). */
const BULLETIN_COLS = [
  { key: 's1_p1', label: '1ère P.', mult: 1 },
  { key: 's1_p2', label: '2ème P.', mult: 1 },
  { key: 's1_exam', label: 'Exam. S1', mult: 2 },
  { key: 'total_s1', label: 'TOT. S1', mult: 4 },
  { key: 's2_p3', label: '3ème P.', mult: 1 },
  { key: 's2_p4', label: '4ème P.', mult: 1 },
  { key: 's2_exam', label: 'Exam. S2', mult: 2 },
  { key: 'total_s2', label: 'TOT. S2', mult: 4 },
  { key: 'total_general', label: 'T.G.', mult: 8 },
]

function formatVal(v: unknown): string {
  if (v == null || v === '') return '-'
  const n = parseFloat(String(v))
  return isNaN(n) ? '-' : n.toFixed(2)
}

/** Retourne true si la note est inférieure à 50 % du max de la colonne (seuil de réussite / note de base). */
function isBelowBase(value: unknown, mult: number, periodMax: number): boolean {
  const n = parseFloat(String(value))
  if (isNaN(n)) return false
  const max = mult * (periodMax || 20)
  return max > 0 && n < max * 0.5
}

export default function TeacherMyClass() {
  const queryClient = useQueryClient()
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear)
  const [searchStudent, setSearchStudent] = useState('')
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes-my-titular'],
    queryFn: async () => {
      const res = await api.get('/schools/classes/my_titular/')
      return res.data
    },
  })

  const { data: academicYearsAvailable } = useQuery({
    queryKey: ['academic-years-available'],
    queryFn: async () => {
      const res = await api.get('/academics/academic-years/available/')
      return res.data as { years?: string[]; current?: string | null }
    },
  })

  const { data: bulletinsData } = useQuery({
    queryKey: ['grade-bulletins-class', selectedClass, academicYear],
    queryFn: async () => {
      if (!selectedClass || !academicYear.trim()) return { results: [] }
      // school_class : uniquement les notes de cette classe et cette année (une promue
      // en 5ème ne doit pas afficher les notes de 4ème)
      const res = await api.get('/academics/grade-bulletins/', {
        params: {
          school_class: String(selectedClass),
          academic_year: academicYear.trim(),
          page_size: '500',
        },
      })
      return res.data
    },
    enabled: !!selectedClass && !!academicYear.trim(),
  })

  const { data: rankingData, isLoading: loadingRanking } = useQuery({
    queryKey: ['class-ranking', selectedClass, academicYear],
    queryFn: async () => {
      if (!selectedClass || !academicYear.trim()) return null
      const res = await api.get('/academics/grade-bulletins/class_ranking/', {
        params: { school_class: String(selectedClass), academic_year: academicYear.trim() },
      })
      return res.data
    },
    enabled: !!selectedClass && !!academicYear.trim(),
  })

  const promoteMutation = useMutation({
    mutationFn: () => api.post(`/schools/classes/${selectedClass}/promote_admitted/`),
    onSuccess: (res) => {
      const d = res.data as { promoted?: number; not_promoted?: number; message?: string }
      queryClient.invalidateQueries({ queryKey: ['class-ranking', selectedClass, academicYear] })
      queryClient.invalidateQueries({ queryKey: ['grade-bulletins-class', selectedClass, academicYear] })
      queryClient.invalidateQueries({ queryKey: ['teacher-classes-my-titular'] })
      // Rafraîchir les inscriptions (parcours) pour l’ancienne et la nouvelle classe
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] })
      showSuccessToast(d?.message ?? `${d?.promoted ?? 0} élève(s) promu(s).`)
    },
    onError: (e: any) => showErrorToast(e, 'Erreur lors de la promotion'),
  })

  const classes = useMemo(() => classesData?.results ?? [], [classesData])

  // Années : endpoint available (AcademicYear + SchoolClass + GradeBulletin). Si vide → saisie libre.
  const yearStrings = useMemo(() => {
    const list = academicYearsAvailable?.years ?? []
    return Array.isArray(list) ? [...list] : []
  }, [academicYearsAvailable?.years])

  // Auto-sélection : 1 classe → celle-ci ; 2+ classes → la plus basse (1ère < 2ème < … < 6ème), avec possibilité de changer
  useEffect(() => {
    if (classes.length === 0 || selectedClass !== null) return
    const sorted = sortClassesByLevel(classes)
    const c = sorted[0] as { id: number; academic_year?: string }
    setSelectedClass(c.id)
    if (c.academic_year) setAcademicYear(c.academic_year)
  }, [classes, selectedClass])

  // Par défaut : current de l'API ou defaultAcademicYear ; corriger si valeur absente de la liste
  useEffect(() => {
    if (!yearStrings.length) return
    const curName = academicYearsAvailable?.current ?? null
    if (!yearStrings.includes(academicYear)) {
      setAcademicYear(curName || yearStrings[0] || defaultAcademicYear)
      return
    }
    if (academicYear === defaultAcademicYear && curName) setAcademicYear(curName)
  }, [academicYearsAvailable?.current, academicYear, yearStrings])

  const selectedClassObj = useMemo(
    () => classes.find((c: any) => c.id === selectedClass),
    [classes, selectedClass]
  )
  const bulletins = useMemo(() => bulletinsData?.results ?? [], [bulletinsData])
  const ranking = useMemo(() => rankingData?.results ?? [], [rankingData])
  const filteredRanking = useMemo(() => {
    const list = ranking
    if (!searchStudent.trim()) return list
    const q = searchStudent.trim().toLowerCase()
    return list.filter((r: any) => {
      const n = (r.student_name || r.user_name || '').toLowerCase()
      const m = (r.matricule || '').toLowerCase()
      return n.includes(q) || m.includes(q)
    })
  }, [ranking, searchStudent])

  const bulletinsByStudent = useMemo(() => {
    const m: Record<number, Record<number, any>> = {}
    bulletins.forEach((b: any) => {
      const sid = b.student
      if (!m[sid]) m[sid] = {}
      m[sid][b.subject] = b
    })
    return m
  }, [bulletins])

  const handleRefreshBulletins = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['grade-bulletins-class'] }),
        queryClient.refetchQueries({ queryKey: ['class-ranking'] }),
      ])
      showSuccessToast('Bulletins actualisés')
    } catch {
      showErrorToast(new Error('Erreur lors de l\'actualisation'), 'Actualisation')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Ma classe (Titulariat)
      </h1>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtres</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classe</label>
            <select
              value={selectedClass ?? ''}
              onChange={(e) => {
                const val = e.target.value
                const id = val ? Number(val) : null
                setSelectedClass(id)
                const c = classes.find((x: any) => x.id === id)
                if (c?.academic_year) setAcademicYear(c.academic_year)
              }}
              className="input"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.academic_year ? ` (${c.academic_year})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Année scolaire</label>
            {yearStrings.length > 0 ? (
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="input">
                {yearStrings.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="ex. 2024-2025 (saisie libre)"
                className="input"
              />
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recherche élève</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Nom, prénom, matricule..."
                className="input pl-9 w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      {classes.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-amber-700 dark:text-amber-300">
            <p className="font-medium">Vous n&apos;êtes titulaire d&apos;aucune classe.</p>
            <p className="text-sm mt-2">L&apos;administrateur de l&apos;école peut vous désigner comme titulaire dans la fiche de chaque classe.</p>
          </div>
        </Card>
      ) : !selectedClass ? (
        <Card>
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Sélectionnez une classe pour afficher les élèves, l&apos;évolution des notes et le classement.
          </div>
        </Card>
      ) : (
        <>
          {/* Classement (pourcentages, place) — données réelles via class_ranking */}
          <Card className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Classement — {rankingData?.school_class ?? selectedClassObj?.name} ({academicYear})
              </h2>
              <button
                type="button"
                onClick={() => promoteMutation.mutate()}
                disabled={promoteMutation.isPending || !selectedClass}
                title={!selectedClassObj?.next_class_name ? "Définir la « classe suivante » (ex. 4ème CG) dans la fiche de la classe (admin)" : undefined}
                className="btn btn-primary flex items-center gap-2"
              >
                {promoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                Promouvoir les admis (≥50 %)
              </button>
            </div>
            {loadingRanking ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
              </div>
            ) : filteredRanking.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                {searchStudent
                  ? 'Aucun élève ne correspond à la recherche.'
                  : 'Aucun élève ou aucune note pour cette classe et cette année.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rang</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Élève</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total points</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pourcentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRanking.map((r: any) => (
                      <tr key={r.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{r.rank}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{r.student_name || r.user_name}</td>
                        <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{r.total_points != null ? Number(r.total_points).toFixed(2) : '-'}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">{r.percentage != null ? Number(r.percentage).toFixed(2) : '-'} %</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Liste des élèves et évolution des notes */}
          <Card>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Élèves et évolution des notes sur le bulletin
              </h2>
              <button
                type="button"
                onClick={handleRefreshBulletins}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-60"
                title="Actualiser les bulletins et le classement"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {loadingRanking ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : filteredRanking.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                Aucun élève dans cette classe pour cette année {searchStudent ? 'ni pour cette recherche' : ''}.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRanking.map((r: any) => {
                  const sid = r.student_id
                  const expanded = expandedStudent === sid
                  const stBulletins = bulletinsByStudent[sid] || {}
                  const subjIds = Object.keys(stBulletins).map(Number)
                  return (
                    <div
                      key={sid}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedStudent(expanded ? null : sid)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-gray-900 dark:text-white">{r.student_name || r.user_name || `Élève #${sid}`}</span>
                          {r.rank != null && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Rang {r.rank} — {(r.percentage ?? 0).toFixed(1)} %
                            </span>
                          )}
                        </div>
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expanded && (
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                          {subjIds.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune note enregistrée pour cette année.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-400">Matière</th>
                                    {BULLETIN_COLS.map((c) => (
                                      <th key={c.key} className="px-2 py-1.5 text-center font-medium text-gray-600 dark:text-gray-400">{c.label}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(stBulletins).map(([subjId, g]: [string, any]) => {
                                    const pm = g.subject_period_max ?? 20
                                    return (
                                      <tr key={subjId} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="px-2 py-1.5 font-medium text-gray-800 dark:text-gray-200">{g.subject_name || `Matière #${subjId}`}</td>
                                        {BULLETIN_COLS.map((c) => {
                                          const below = isBelowBase(g[c.key], c.mult, pm)
                                          return (
                                            <td
                                              key={c.key}
                                              className={`px-2 py-1.5 text-center ${below ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                            >
                                              {formatVal(g[c.key])}
                                            </td>
                                          )
                                        })}
                                      </tr>
                                    )
                                  })}
                                  {/* Ligne Pourcentage : somme notes / somme (note de base × coef) × 100. Rouge si < 50 %. */}
                                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/70">
                                    <td className="px-2 py-1.5 font-medium text-gray-800 dark:text-gray-200">Pourcentage</td>
                                    {BULLETIN_COLS.map((c) => {
                                      const list = Object.values(stBulletins) as any[]
                                      const sumPoints = list.reduce((s, g) => s + (parseFloat(String(g[c.key])) || 0), 0)
                                      const sumMax = list.reduce((s, g) => s + ((c.mult ?? 1) * (g.subject_period_max ?? 20)), 0)
                                      const pctNum = sumMax > 0 ? (sumPoints / sumMax) * 100 : null
                                      const pct = pctNum != null ? pctNum.toFixed(1) + ' %' : '-'
                                      const below = typeof pctNum === 'number' && pctNum < 50
                                      return (
                                        <td key={c.key} className={`px-2 py-1.5 text-center font-medium ${below ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{pct}</td>
                                      )
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
