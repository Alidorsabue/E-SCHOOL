import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { BookOpen, Download, Eye, FileText } from 'lucide-react'

export default function TeacherLibrary() {
  const navigate = useNavigate()
  
  const { data: books, isLoading, error } = useQuery({
    queryKey: ['teacher-library'],
    queryFn: async () => {
      const response = await api.get('/library/books/')
      return response.data
    },
    retry: 1,
  })

  // Charger toutes les progressions de lecture
  const { data: allProgress } = useQuery({
    queryKey: ['all-reading-progress'],
    queryFn: async () => {
      try {
        const response = await api.get('/library/reading-progress/')
        const progressList = response.data?.results || response.data || []
        const progressMap: Record<number, any> = {}
        progressList.forEach((progress: any) => {
          progressMap[progress.book] = progress
        })
        return progressMap
      } catch (error: any) {
        return {}
      }
    },
  })

  const getImageUrl = (book: any) => {
    if (book.cover_image) {
      if (book.cover_image.startsWith('http')) {
        return book.cover_image
      }
      const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000'
      const imagePath = book.cover_image.startsWith('/') ? book.cover_image : `/${book.cover_image}`
      return `${baseUrl}${imagePath}`
    }
    return null
  }

  const getFileUrl = (book: any) => {
    if (book.book_file) {
      if (book.book_file.startsWith('http')) {
        return book.book_file
      }
      const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000'
      const filePath = book.book_file.startsWith('/') ? book.book_file : `/${book.book_file}`
      return `${baseUrl}${filePath}`
    }
    return null
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Bibliothèque</h1>

      {isLoading ? (
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des livres...</p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="text-center py-12 text-red-600">
            Erreur lors du chargement des livres
          </div>
        </Card>
      ) : !books?.results || books?.results?.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Aucun livre trouvé</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books?.results?.map((book: any) => {
            const coverImageUrl = getImageUrl(book)
            return (
              <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image de couverture */}
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const placeholder = target.nextElementSibling as HTMLElement
                        if (placeholder) {
                          placeholder.style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center ${coverImageUrl ? 'hidden' : ''}`}
                  >
                    <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                  {/* Badge de statut */}
                  <div className="absolute top-2 right-2">
                    {book.is_published ? (
                      <span className="badge badge-success">Publié</span>
                    ) : (
                      <span className="badge badge-warning">Brouillon</span>
                    )}
                  </div>
                  {/* Badge prix */}
                  <div className="absolute top-2 left-2">
                    {book.is_free ? (
                      <span className="badge badge-success">Gratuit</span>
                    ) : (
                      <span className="badge badge-info bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {book.price || 0} {book.currency || 'USD'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Contenu de la carte */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Par {book.author || 'Auteur inconnu'}
                  </p>
                  {book.category_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                      {book.category_name}
                    </p>
                  )}
                  {book.classes_names && book.classes_names.length > 0 && (
                    <p className="text-xs text-primary-600 dark:text-primary-400 mb-2">
                      Classes: {book.classes_names.join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {book.description}
                  </p>
                  
                  {/* Statistiques */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {book.download_count || 0}
                    </span>
                    {book.pages && (
                      <span>{book.pages} pages</span>
                    )}
                  </div>

                  {/* Progression de lecture */}
                  {allProgress && allProgress[book.id] && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          Progression
                        </span>
                        <span>
                          {Math.round(allProgress[book.id].progress_percentage || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-primary-600 h-1.5 rounded-full transition-all"
                          style={{ 
                            width: `${allProgress[book.id].progress_percentage || 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    {(book.book_file || book.book_url) && (
                      <>
                        <button
                          onClick={() => navigate(`/book/${book.id}/read`)}
                          className="flex-1 btn btn-primary text-sm py-2 flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {allProgress && allProgress[book.id] ? 'Continuer' : 'Lire'}
                        </button>
                        {book.book_file && (
                          <a
                            href={getFileUrl(book) || '#'}
                            download
                            className="btn btn-secondary text-sm py-2 px-3"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
