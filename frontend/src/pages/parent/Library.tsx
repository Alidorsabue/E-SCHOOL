import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { BookOpen, Download } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Link } from 'react-router-dom'

export default function ParentLibrary() {
  const { data: books, isLoading, error } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const response = await api.get('/library/books/')
      return response.data
    },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Bibliothèque Numérique</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <Card className="col-span-full">
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">Chargement...</div>
          </Card>
        ) : error ? (
          <Card className="col-span-full">
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              Erreur lors du chargement de la bibliothèque. Veuillez réessayer plus tard.
            </div>
          </Card>
        ) : !books?.results || books.results.length === 0 ? (
          <Card className="col-span-full">
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Aucun livre disponible pour le moment.
            </div>
          </Card>
        ) : (
          books.results.map((book: any) => (
            <Card key={book.id}>
              {book.cover_image && (
                <img
                  src={book.cover_image}
                  alt={book.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{book.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Par {book.author}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{book.description}</p>
              <div className="flex items-center justify-between">
                <span className={cn(
                  'badge',
                  book.is_free 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                )}>
                  {book.is_free ? 'Gratuit' : `${book.price} ${book.currency}`}
                </span>
                {book.file_url ? (
                  <a
                    href={book.file_url}
                    download
                    className="btn btn-primary text-sm flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger</span>
                  </a>
                ) : book.id ? (
                  <Link
                    to={`/book/${book.id}/read`}
                    className="btn btn-primary text-sm flex items-center space-x-1"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Lire</span>
                  </Link>
                ) : (
                  <button 
                    disabled
                    className="btn btn-primary text-sm flex items-center space-x-1 opacity-50 cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Indisponible</span>
                  </button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
