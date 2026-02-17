import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Save,
  Download,
  StickyNote,
  FileText,
  X,
  Plus
} from 'lucide-react'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

export default function BookReader() {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const objectRef = useRef<HTMLObjectElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Charger les informations du livre
  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const response = await api.get(`/library/books/${bookId}/`)
      return response.data
    },
    enabled: !!bookId,
  })

  // Charger la progression de lecture
  const { data: progress } = useQuery({
    queryKey: ['reading-progress', bookId],
    queryFn: async () => {
      try {
        const response = await api.get('/library/reading-progress/', {
          params: { book: bookId }
        })
        const progressList = response.data?.results || response.data || []
        return progressList.length > 0 ? progressList[0] : null
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: !!bookId,
  })

  // Charger les annotations
  const { data: annotations, refetch: refetchAnnotations } = useQuery({
    queryKey: ['book-annotations', bookId],
    queryFn: async () => {
      const response = await api.get('/library/annotations/', {
        params: { book: bookId, page_number: currentPage }
      })
      return response.data?.results || response.data || []
    },
    enabled: !!bookId && showAnnotations,
  })

  // Charger les notes
  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['book-notes', bookId],
    queryFn: async () => {
      const response = await api.get('/library/notes/', {
        params: { book: bookId }
      })
      return response.data?.results || response.data || []
    },
    enabled: !!bookId && showNotes,
  })

  // Mutation pour sauvegarder la progression
  const saveProgressMutation = useMutation({
    mutationFn: async (page: number) => {
      return api.post(`/library/books/${bookId}/update_progress/`, {
        current_page: page,
        total_pages: totalPages || book?.pages,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-progress', bookId] })
    },
    onError: (error: any) => {
      console.error('Erreur lors de la sauvegarde de la progression:', error)
    },
  })

  // Mutation pour créer une annotation
  const createAnnotationMutation = useMutation({
    mutationFn: async (data: { page_number: number; content: string; color?: string }) => {
      return api.post('/library/annotations/', {
        book: bookId,
        ...data,
      })
    },
    onSuccess: () => {
      refetchAnnotations()
      showSuccessToast('Annotation créée avec succès')
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors de la création de l\'annotation')
    },
  })

  // Mutation pour créer une note
  const createNoteMutation = useMutation({
    mutationFn: async (data: { title?: string; content: string; page_reference?: number }) => {
      return api.post('/library/notes/', {
        book: bookId,
        ...data,
      })
    },
    onSuccess: () => {
      refetchNotes()
      showSuccessToast('Note créée avec succès')
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors de la création de la note')
    },
  })

  // Fonction pour sauvegarder la progression avec debounce
  const saveProgress = (page: number) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    setIsSaving(true)
    saveTimeoutRef.current = setTimeout(() => {
      saveProgressMutation.mutate(page, {
        onSettled: () => {
          setIsSaving(false)
        },
      })
    }, 1000)
  }

  // Initialiser la page depuis la progression sauvegardée
  useEffect(() => {
    if (progress && progress.current_page > 0) {
      setCurrentPage(progress.current_page)
      setTotalPages(progress.total_pages || book?.pages || 0)
    } else if (book?.pages) {
      setTotalPages(book.pages)
    }
  }, [progress, book])

  // Charger le PDF via l'endpoint authentifié ou utiliser book_url
  useEffect(() => {
    if (bookId && book) {
      // Si le livre a une URL, l'utiliser directement
      if (book.book_url) {
        setPdfUrl(book.book_url)
        setPdfError(null)
        return
      }
      
      // Sinon, utiliser le fichier via l'endpoint authentifié
      if (book.book_file) {
        const token = localStorage.getItem('access_token')
        const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000'
        const pdfUrl = `${baseUrl}/api/library/books/${bookId}/download_file/`
        
        // Créer une URL blob pour le PDF
        api.get(pdfUrl, {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          const blob = new Blob([response.data], { type: 'application/pdf' })
          const url = URL.createObjectURL(blob)
          setPdfUrl(url)
          setPdfError(null)
        }).catch((error) => {
          console.error('Erreur lors du chargement du PDF:', error)
          setPdfError('Impossible de charger le fichier PDF')
        })
      } else {
        setPdfError('Aucun fichier ou lien disponible pour ce livre')
      }
    }
  }, [bookId, book])

  // Incrémenter le compteur de vues au chargement
  useEffect(() => {
    if (bookId) {
      api.post(`/library/books/${bookId}/increment_view/`).catch(() => {
        // Ignorer les erreurs silencieusement
      })
    }
  }, [bookId])

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      saveProgress(newPage)
      refetchAnnotations()
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      saveProgress(newPage)
      refetchAnnotations()
    }
  }

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      saveProgress(page)
      refetchAnnotations()
    }
  }

  const handleSaveNow = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveProgressMutation.mutate(currentPage)
  }

  const handleCreateAnnotation = (content: string) => {
    if (content.trim()) {
      createAnnotationMutation.mutate({
        page_number: currentPage,
        content: content.trim(),
        color: '#FFEB3B',
      })
    }
  }

  const handleCreateNote = (title: string, content: string) => {
    if (content.trim()) {
      createNoteMutation.mutate({
        title: title.trim() || undefined,
        content: content.trim(),
        page_reference: currentPage,
      })
    }
  }

  if (bookLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement du livre...</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Livre introuvable</p>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-primary mt-4"
          >
            Retour
          </button>
        </Card>
      </div>
    )
  }

  const progressPercentage = totalPages > 0 
    ? Math.round((currentPage / totalPages) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Lecteur PDF - Zone principale */}
      <div className="flex-1 flex flex-col">
        {/* En-tête avec contrôles */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {book.title}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Par {book.author}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Save className="w-3 h-3" />
                    Sauvegarde...
                  </span>
                )}
                <button
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className={`btn ${showAnnotations ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
                >
                  <StickyNote className="w-4 h-4" />
                  Annotations
                </button>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`btn ${showNotes ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
                >
                  <FileText className="w-4 h-4" />
                  Notes
                </button>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progression: {progressPercentage}%</span>
                <span>Page {currentPage} sur {totalPages || '?'}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Contrôles de navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Page:
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={handlePageInput}
                  className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  / {totalPages || '?'}
                </span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleSaveNow}
                className="btn btn-primary flex items-center gap-2"
                title="Sauvegarder la progression maintenant"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>

        {/* Lecteur PDF */}
        <div className="flex-1 relative">
          {pdfError ? (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <p className="text-red-600 dark:text-red-400 mb-4">{pdfError}</p>
                <button
                  onClick={() => navigate(-1)}
                  className="btn btn-primary"
                >
                  Retour
                </button>
              </Card>
            </div>
          ) : pdfUrl ? (
            // key force le rechargement du PDF à chaque changement de page (les navigateurs
            // n'appliquent pas toujours #page=N dynamiquement)
            (() => {
              const urlWithPage = pdfUrl.includes('#') ? pdfUrl.split('#')[0] + `#page=${currentPage}` : `${pdfUrl}#page=${currentPage}`
              return pdfUrl.startsWith('http') || pdfUrl.startsWith('https') ? (
                <iframe
                  key={`pdf-${currentPage}`}
                  src={urlWithPage}
                  className="w-full h-full border-0"
                  title={`Lecteur: ${book.title}`}
                  style={{ minHeight: '600px' }}
                />
              ) : (
                <object
                  key={`pdf-${currentPage}`}
                  ref={objectRef}
                  data={urlWithPage}
                  type="application/pdf"
                  className="w-full h-full"
                  style={{ minHeight: '600px' }}
                >
                <div className="flex items-center justify-center h-full">
                  <Card className="p-8 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Votre navigateur ne peut pas afficher les PDFs.
                    </p>
                    <a
                      href={pdfUrl}
                      download
                      className="btn btn-primary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le PDF
                    </a>
                  </Card>
                </div>
              </object>
              )
            })()
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement du PDF...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panneau latéral - Annotations et Notes */}
      {(showAnnotations || showNotes) && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {showAnnotations ? 'Annotations' : 'Notes'}
            </h2>
            <button
              onClick={() => {
                setShowAnnotations(false)
                setShowNotes(false)
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {showAnnotations && (
              <>
                <AnnotationForm 
                  pageNumber={currentPage}
                  onSubmit={handleCreateAnnotation}
                />
                <div className="space-y-3 mt-4">
                  {annotations?.map((annotation: any) => (
                    <AnnotationCard key={annotation.id} annotation={annotation} />
                  ))}
                  {(!annotations || annotations.length === 0) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Aucune annotation pour cette page
                    </p>
                  )}
                </div>
              </>
            )}

            {showNotes && (
              <>
                <NoteForm 
                  pageNumber={currentPage}
                  onSubmit={handleCreateNote}
                />
                <div className="space-y-3 mt-4">
                  {notes?.map((note: any) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                  {(!notes || notes.length === 0) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Aucune note pour ce livre
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Composant pour le formulaire d'annotation
function AnnotationForm({ pageNumber, onSubmit }: { pageNumber: number; onSubmit: (content: string) => void }) {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(content)
      setContent('')
    }
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        Nouvelle annotation (Page {pageNumber})
      </h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ajouter une annotation..."
          className="input text-sm"
          rows={3}
        />
        <button type="submit" className="btn btn-primary w-full text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </button>
      </form>
    </Card>
  )
}

// Composant pour afficher une annotation
function AnnotationCard({ annotation }: { annotation: any }) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Page {annotation.page_number}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(annotation.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-900 dark:text-white">
        {annotation.content}
      </p>
    </Card>
  )
}

// Composant pour le formulaire de note
function NoteForm({ pageNumber, onSubmit }: { pageNumber: number; onSubmit: (title: string, content: string) => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(title, content)
      setTitle('')
      setContent('')
    }
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        Nouvelle note
      </h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre (optionnel)"
          className="input text-sm"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenu de la note..."
          className="input text-sm"
          rows={4}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Référence: Page {pageNumber}
        </div>
        <button type="submit" className="btn btn-primary w-full text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </button>
      </form>
    </Card>
  )
}

// Composant pour afficher une note
function NoteCard({ note }: { note: any }) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {note.title || 'Sans titre'}
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(note.updated_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
        {note.content}
      </p>
      {note.page_reference && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Page {note.page_reference}
        </span>
      )}
    </Card>
  )
}
