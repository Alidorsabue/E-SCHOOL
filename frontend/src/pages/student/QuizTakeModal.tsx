import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { X, Play, Loader2, Send } from 'lucide-react'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

interface QuizTakeModalProps {
  quiz: { id: number; title: string; description?: string; time_limit?: number; total_points: number }
  onClose: () => void
  onComplete?: () => void
}

export default function QuizTakeModal({ quiz, onClose, onComplete }: QuizTakeModalProps) {
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [attempt, setAttempt] = useState<any>(null)
  const [startTime] = useState(() => Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [elapsed, setElapsed] = useState(0)

  // Timer
  useEffect(() => {
    if (!attempt || quiz.time_limit == null) return
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000)
      setElapsed(s)
      if (quiz.time_limit && s >= quiz.time_limit * 60) {
        if (timerRef.current) clearInterval(timerRef.current)
        handleSubmit()
      }
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [attempt])

  const startMutation = useMutation({
    mutationFn: () => api.post('/elearning/quiz-attempts/start/', { quiz: quiz.id }),
    onSuccess: (res) => {
      setAttempt(res.data)
    },
    onError: (err: any) => {
      showErrorToast(err, 'Impossible de démarrer l\'examen')
    },
  })

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['quiz-questions', quiz.id],
    queryFn: async () => {
      const res = await api.get(`/elearning/quizzes/${quiz.id}/questions/`)
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: !!attempt,
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      const timeTaken = Math.floor((Date.now() - startTime) / 60000)
      const answersData = Object.entries(answers).map(([questionId, answerText]) => ({
        question_id: parseInt(questionId, 10),
        answer_text: answerText || '',
      }))
      return api.post(`/elearning/quiz-attempts/${attempt.id}/submit/`, {
        answers: answersData,
        time_taken_minutes: timeTaken,
      })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['student-quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['student-quiz-attempts'] })
      queryClient.invalidateQueries({ queryKey: ['student-elearning-grades'] })
      showSuccessToast('Examen soumis. Votre score : ' + (res.data?.score ?? '-'))
      onComplete?.()
      onClose()
    },
    onError: (err: any) => {
      showErrorToast(err, 'Erreur lors de la soumission')
    },
  })

  const handleSubmit = () => {
    if (!attempt) return
    submitMutation.mutate()
  }

  const renderQuestionInput = (q: any) => {
    const value = answers[q.id] ?? ''
    const setValue = (v: string) => setAnswers((prev) => ({ ...prev, [q.id]: v }))

    switch (q.question_type) {
      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE':
        const opts = [
          { key: 'A', val: q.option_a },
          { key: 'B', val: q.option_b },
          { key: 'C', val: q.option_c },
          { key: 'D', val: q.option_d },
        ].filter((o) => o.val)
        if (q.question_type === 'MULTIPLE_CHOICE') {
          const selected = value ? value.split(',').filter(Boolean) : []
          const toggle = (k: string) => {
            const next = selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k].sort()
            setValue(next.join(','))
          }
          return (
            <div className="space-y-2">
              {opts.map((o) => (
                <label key={o.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(o.key)} onChange={() => toggle(o.key)} className="w-4 h-4" />
                  <span>{o.val}</span>
                </label>
              ))}
            </div>
          )
        }
        return (
          <div className="space-y-2">
            {opts.map((o) => (
              <label key={o.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={o.key}
                  checked={value === o.key}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-4 h-4"
                />
                <span>{o.val}</span>
              </label>
            ))}
          </div>
        )
      case 'TRUE_FALSE':
        return (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={`q-${q.id}`} value="true" checked={value === 'true'} onChange={(e) => setValue(e.target.value)} className="w-4 h-4" />
              <span>Vrai</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={`q-${q.id}`} value="false" checked={value === 'false'} onChange={(e) => setValue(e.target.value)} className="w-4 h-4" />
              <span>Faux</span>
            </label>
          </div>
        )
      case 'NUMBER':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input w-full max-w-xs"
            placeholder="Votre réponse..."
          />
        )
      case 'TEXT':
      case 'SHORT_ANSWER':
      case 'ESSAY':
      default:
        return (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input w-full min-h-[80px]"
            placeholder="Votre réponse..."
            rows={q.question_type === 'ESSAY' ? 6 : 3}
          />
        )
    }
  }

  if (!attempt) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{quiz.title}</h2>
          {quiz.description && <p className="text-gray-600 dark:text-gray-400 mb-4">{quiz.description}</p>}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Durée : {quiz.time_limit ? `${quiz.time_limit} minutes` : 'Illimitée'} · {quiz.total_points} points
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="btn btn-secondary">Annuler</button>
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              {startMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Commencer l'examen
            </button>
          </div>
        </div>
      </div>
    )
  }

  const remaining = quiz.time_limit ? Math.max(0, quiz.time_limit * 60 - elapsed) : 0
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{quiz.title}</h2>
          <div className="flex items-center gap-4">
            {quiz.time_limit != null && (
              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                {mm}:{ss.toString().padStart(2, '0')}
              </span>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : questions.length ? (
            questions.map((q: any, idx: number) => (
              <div key={q.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <span className="font-medium text-primary-600 dark:text-primary-400">Q{idx + 1}.</span>
                  <p className="text-gray-900 dark:text-white flex-1">{q.question_text}</p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{q.points} pt(s)</span>
                </div>
                {renderQuestionInput(q)}
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune question.</p>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">Quitter</button>
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Soumettre l'examen
          </button>
        </div>
      </div>
    </div>
  )
}
