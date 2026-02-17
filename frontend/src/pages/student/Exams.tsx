import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Clock, Play } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import QuizTakeModal from './QuizTakeModal'

export default function StudentExams() {
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['student-quizzes'],
    queryFn: async () => {
      const response = await api.get('/elearning/quizzes/')
      return response.data
    },
  })

  const { data: attempts } = useQuery({
    queryKey: ['student-quiz-attempts'],
    queryFn: async () => {
      const response = await api.get('/elearning/quiz-attempts/')
      return (response.data?.results ?? response.data ?? []) as any[]
    },
  })

  const bestAttemptByQuiz = (attempts ?? [])
    .filter((a: any) => a.submitted_at && a.score != null)
    .reduce((acc: Record<number, any>, a: any) => {
      const qid = typeof a.quiz === 'object' ? a.quiz?.id : a.quiz
      if (qid != null && (!acc[qid] || Number(a.score) > Number(acc[qid].score))) {
        acc[qid] = a
      }
      return acc
    }, {})

  const canStart = (quiz: any) => {
    const now = new Date()
    const start = new Date(quiz.start_date)
    let end = new Date(quiz.end_date)
    // Si end_date est à minuit (date sans heure), considérer la fin de la journée
    if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
      end = new Date(end)
      end.setHours(23, 59, 59, 999)
    }
    return now >= start && now <= end
  }

  const quizList = quizzes?.results ?? quizzes ?? []
  const hasQuizzes = Array.isArray(quizList) && quizList.length > 0

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Examens</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
        ) : hasQuizzes ? (
          quizList.map((quiz: any) => {
            const attempt = bestAttemptByQuiz[quiz.id]
            const myScore = attempt?.score != null ? Number(attempt.score) : null
            const totalPts = Number(quiz.total_points ?? 20)
            return (
            <Card key={quiz.id}>
              <h3 className="text-lg font-semibold mb-2">{quiz.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(quiz.start_date), 'dd MMM yyyy', { locale: fr })} -{' '}
                    {format(new Date(quiz.end_date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
                {quiz.time_limit && (
                  <p className="text-sm text-gray-500">
                    Durée: {quiz.time_limit} minutes
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-500">
                    Points: {totalPts}
                  </span>
                  {myScore != null && (
                    <span className="badge badge-success">
                      Votre note : {myScore}/{totalPts}
                      {attempt?.is_passed != null && (
                        attempt.is_passed ? ' ✓ Réussi' : ' - Non réussi'
                      )}
                    </span>
                  )}
                </div>
              </div>
              {canStart(quiz) ? (
                <button
                  onClick={() => setSelectedQuiz(quiz)}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Commencer l'examen</span>
                </button>
              ) : (
                <button className="btn btn-secondary w-full" disabled>
                  {new Date(quiz.start_date) > new Date() ? 'Pas encore disponible' : 'Terminé'}
                </button>
              )}
            </Card>
            )
          })
        ) : (
          <div className="col-span-full p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Aucun examen disponible.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Les quiz et examens seront publiés par vos enseignants.</p>
          </div>
        )}
      </div>

      {selectedQuiz && (
        <QuizTakeModal
          quiz={selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
        />
      )}
    </div>
  )
}
