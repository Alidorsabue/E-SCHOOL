import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'

type Row = { id: string; label: string; term: string; score: string; isSubRow?: boolean }

export default function StudentGrades() {
  const { data: bulletinGrades, isLoading: loadingBulletins } = useQuery({
    queryKey: ['student-grade-bulletins'],
    queryFn: async () => {
      const response = await api.get('/academics/grade-bulletins/')
      return response.data
    },
  })

  const { data: grades, isLoading: loadingGrades } = useQuery({
    queryKey: ['student-grades'],
    queryFn: async () => {
      const response = await api.get('/academics/grades/')
      return response.data
    },
  })

  const { data: reportCards } = useQuery({
    queryKey: ['student-report-cards'],
    queryFn: async () => {
      const response = await api.get('/academics/report-cards/')
      return response.data
    },
  })

  const { data: elearningData } = useQuery({
    queryKey: ['student-elearning-grades'],
    queryFn: async () => {
      const [submissionsRes, attemptsRes] = await Promise.all([
        api.get('/elearning/submissions/'),
        api.get('/elearning/quiz-attempts/'),
      ])
      const subs = submissionsRes.data?.results ?? submissionsRes.data ?? []
      const atts = attemptsRes.data?.results ?? attemptsRes.data ?? []
      return { submissions: subs, attempts: atts }
    },
  })

  const bulletinList = Array.isArray(bulletinGrades?.results ?? bulletinGrades) ? (bulletinGrades?.results ?? bulletinGrades) : []
  const gradeList = Array.isArray(grades?.results ?? grades) ? (grades?.results ?? grades) : []
  const reportCardList = reportCards?.results ?? reportCards ?? []

  const flatRows = useMemo(() => {
    const subs = elearningData?.submissions ?? []
    const atts = elearningData?.attempts ?? []
    const subjectMap = new Map<string, { general: Row[]; devoirs: Row[]; examens: Row[] }>()

    const add = (subject: string, type: 'general' | 'devoirs' | 'examens', row: Row) => {
      if (!subjectMap.has(subject)) subjectMap.set(subject, { general: [], devoirs: [], examens: [] })
      const g = subjectMap.get(subject)!
      if (type === 'general') g.general.push(row)
      else if (type === 'devoirs') g.devoirs.push(row)
      else g.examens.push(row)
    }

    bulletinList.forEach((b: any) => {
      const sn = b.subject_name || 'Matière'
      add(sn, 'general', {
        id: `b-${b.id}`,
        label: sn,
        term: b.academic_year || '',
        score: String(b.total_general ?? ''),
        isSubRow: false,
      })
    })

    gradeList.forEach((g: any) => {
      const sn = g.subject_name || 'Matière'
      add(sn, 'general', {
        id: `g-${g.id}`,
        label: sn,
        term: g.term || g.academic_year || '',
        score: g.total_score != null ? `${g.total_score}/20` : '',
        isSubRow: false,
      })
    })

    subs.forEach((s: any) => {
      if (s.score == null) return
      const subject = s.assignment_subject_name || s.assignment_title || 'Matière'
      const max = s.assignment?.total_points ?? s.total_points ?? 20
      add(subject, 'devoirs', {
        id: `sub-${s.id}`,
        label: s.assignment_title || 'Devoir',
        term: 'Devoir',
        score: `${s.score}/${max}`,
        isSubRow: true,
      })
    })

    atts.forEach((a: any) => {
      if (a.score == null) return
      const subject = a.quiz_subject_name || a.quiz_title || 'Matière'
      const max = a.quiz?.total_points ?? a.total_points ?? 20
      add(subject, 'examens', {
        id: `att-${a.id}`,
        label: a.quiz_title || 'Examen',
        term: 'Examen',
        score: `${a.score}/${max}`,
        isSubRow: true,
      })
    })

    const result: { subject: string; rows: Row[] }[] = []
    subjectMap.forEach((data, subject) => {
      const rows: Row[] = []
      if (data.general.length > 0) {
        data.general.forEach((r, i) => rows.push({ ...r, label: i === 0 ? subject : r.label, isSubRow: false }))
      } else if (data.devoirs.length > 0 || data.examens.length > 0) {
        rows.push({
          id: `header-${subject}`,
          label: subject,
          term: '',
          score: '',
          isSubRow: false,
        })
      }
      data.devoirs.forEach((r) => rows.push(r))
      data.examens.forEach((r) => rows.push(r))
      if (rows.length > 0) result.push({ subject, rows })
    })
    return result
  }, [bulletinList, gradeList, elearningData])

  const hasGrades = flatRows.length > 0
  const hasReportCards = Array.isArray(reportCardList) && reportCardList.length > 0
  const hasBulletinData = bulletinList.length > 0
  const isLoading = loadingBulletins || loadingGrades

  const getBulletinPdfUrl = (studentId: number, schoolClassId: number | null, academicYear: string) => {
    if (!studentId || !schoolClassId || !academicYear) return null
    const base = api.defaults.baseURL || '/api'
    return `${window.location.origin}${base}/accounts/students/${studentId}/bulletin_pdf/?school_class=${schoolClassId}&academic_year=${encodeURIComponent(academicYear)}`
  }

  const bulletinByYear = useMemo(() => {
    const byYear = new Map<string, { student: number; school_class: number | null; academic_year: string }>()
    bulletinList.forEach((b: any) => {
      const key = `${b.academic_year}-${b.school_class || 0}`
      if (!byYear.has(key) && b.student) {
        byYear.set(key, {
          student: b.student,
          school_class: b.school_class,
          academic_year: b.academic_year || '',
        })
      }
    })
    return Array.from(byYear.values())
  }, [bulletinList])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Notes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Notes par matière</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Note générale par matière, puis détail des devoirs et examens (e-learning).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Matière</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Trimestre / Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">Chargement...</td>
                  </tr>
                ) : hasGrades ? (
                  flatRows.map((grp) => (
                    <React.Fragment key={grp.subject}>
                      {grp.rows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={
                            row.isSubRow
                              ? 'bg-white dark:bg-gray-900'
                              : 'bg-gray-50/50 dark:bg-gray-800/50'
                          }
                        >
                          <td
                            className={`px-4 py-2 text-sm ${row.isSubRow ? 'pl-8 text-gray-600 dark:text-gray-400' : 'font-medium'}`}
                          >
                            {row.isSubRow ? row.label : (idx === 0 ? grp.subject : row.label)}
                          </td>
                          <td className="px-4 py-2 text-sm">{row.term}</td>
                          <td className="px-4 py-2 text-sm font-medium">{row.score}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Aucune note enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Bulletins</h2>
          <div className="space-y-3">
            {hasReportCards ? (
              reportCardList.map((report: any) => (
                <div key={report.id} className="border rounded-lg p-4 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {report.academic_year} - {report.term === 'AN' ? 'Annuel (bulletin RDC)' : report.term}
                    </h3>
                    <span className="badge badge-info">
                      Moyenne: {report.average_score}/20
                    </span>
                  </div>
                  {report.rank != null && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Rang: {report.rank}/{report.total_students}
                    </p>
                  )}
                  <a
                    href={
                      report.pdf_file
                        ? report.pdf_file
                        : `${window.location.origin}${api.defaults.baseURL || '/api'}/academics/report-cards/${report.id}/download_pdf/`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                  >
                    {report.pdf_file ? 'Télécharger le bulletin PDF' : 'Générer et télécharger le bulletin PDF'}
                  </a>
                </div>
              ))
            ) : hasBulletinData && bulletinByYear.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Bulletin synthétique à partir des notes enregistrées.
                </p>
                {bulletinByYear.map((by, idx) => {
                  const pdfUrl = getBulletinPdfUrl(by.student, by.school_class, by.academic_year)
                  return (
                    <div key={idx} className="border rounded-lg p-4 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {by.academic_year} - Bulletin RDC
                        </h3>
                        {pdfUrl && (
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                          >
                            Télécharger le bulletin PDF
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notes par matière enregistrées.
                      </p>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                Aucun bulletin disponible.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
