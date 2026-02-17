import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { BookOpen } from 'lucide-react'

export default function StudentLibrary() {
  const navigate = useNavigate()
  const { data: books, isLoading } = useQuery({
    queryKey: ['student-books'],
    queryFn: async () => {
      const response = await api.get('/library/books/')
      return response.data
    },
  })

  const bookList = books?.results ?? books ?? []
  const hasBooks = Array.isArray(bookList) && bookList.length > 0

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Bibliothèque Numérique</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
        ) : hasBooks ? (
          bookList.map((book: any) => (
            <Card key={book.id}>
              {book.cover_image && (
                <img
                  src={book.cover_image}
                  alt={book.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-lg font-semibold mb-2">{book.title}</h3>
              <p className="text-sm text-gray-600 mb-2">Par {book.author}</p>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{book.description}</p>
              <div className="flex items-center justify-between">
                <span className={`badge ${book.is_free ? 'badge-success' : 'badge-warning'}`}>
                  {book.is_free ? 'Gratuit' : `${book.price} ${book.currency}`}
                </span>
                {(book.book_file || book.book_url) ? (
                  <button
                    onClick={() => navigate(`/book/${book.id}/read`)}
                    className="btn btn-primary text-sm flex items-center space-x-1"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Lire</span>
                  </button>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Contenu non disponible</span>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Aucun livre disponible dans la bibliothèque.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Les livres sont ajoutés par l'administration de l'école.</p>
          </div>
        )}
      </div>
    </div>
  )
}
