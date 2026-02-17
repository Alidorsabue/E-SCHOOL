import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Plus, Upload, FileText, Download, Eye, BookOpen, Pencil, Send } from 'lucide-react'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { showErrorToast, showSuccessToast } from '@/utils/toast'

const bookSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  author: z.string().min(1, 'L\'auteur est requis'),
  isbn: z.string().optional(),
  category: z.number().optional(),
  description: z.string().min(1, 'La description est requise'),
  is_free: z.boolean(),
  price: z.number().min(0).optional(),
  currency: z.string().default('CDF'),
  language: z.string().default('fr'),
  pages: z.number().optional(),
  is_published: z.boolean().default(false),
  classes: z.array(z.number()).optional(),
  book_url: z.string().url('URL invalide').optional().or(z.literal('')),
})

type BookForm = z.infer<typeof bookSchema>

export default function AdminLibrary() {
  const [showForm, setShowForm] = useState(false)
  const [editingBook, setEditingBook] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<BookForm>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      is_free: true,
      currency: 'CDF',
      language: 'fr',
      is_published: false,
      classes: [],
      book_url: '',
    },
  })

  const isFree = watch('is_free')

  const { data: books, isLoading, error } = useQuery({
    queryKey: ['library-books'],
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
        // Créer un map pour un accès rapide par book_id
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

  const { data: categories } = useQuery({
    queryKey: ['book-categories'],
    queryFn: async () => {
      const response = await api.get('/library/categories/')
      return response.data
    },
  })

  // Charger les classes disponibles
  const { data: classes } = useQuery({
    queryKey: ['school-classes'],
    queryFn: async () => {
      const response = await api.get('/schools/classes/')
      return response.data
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Afficher le nom du fichier
      setFilePreview(file.name)
    }
  }

  const createMutation = useMutation({
    mutationFn: async (data: BookForm) => {
      const formData = new FormData()
      
      // Ajouter tous les champs du formulaire
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof BookForm]
        if (value !== undefined && value !== null && key !== 'classes') {
          if (typeof value === 'boolean') {
            formData.append(key, value.toString())
          } else if (value !== '') {
            formData.append(key, value.toString())
          }
        }
      })
      
      // Ajouter les classes sélectionnées
      if (selectedClasses.length > 0) {
        selectedClasses.forEach((classId: number) => {
          formData.append('classes', classId.toString())
        })
      }
      
      // Ajouter le fichier si sélectionné
      if (selectedFile) {
        formData.append('book_file', selectedFile)
      }
      
      return api.post('/library/books/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] })
      showSuccessToast('Livre créé avec succès')
      setShowForm(false)
      reset()
      setSelectedFile(null)
      setFilePreview(null)
      setSelectedClasses([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors de la création du livre')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BookForm> }) => {
      const formData = new FormData()
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof BookForm]
        if (value !== undefined && value !== null && key !== 'classes') {
          if (typeof value === 'boolean') {
            formData.append(key, value.toString())
          } else if (value !== '') {
            formData.append(key, value.toString())
          }
        }
      })
      if (selectedClasses.length > 0) {
        selectedClasses.forEach((classId: number) => formData.append('classes', classId.toString()))
      } else {
        formData.append('classes', '')
      }
      if (selectedFile) formData.append('book_file', selectedFile)
      return api.patch(`/library/books/${id}/`, formData, {
        headers: selectedFile ? { 'Content-Type': 'multipart/form-data' } : {},
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] })
      showSuccessToast('Livre mis à jour')
      setEditingBook(null)
      setSelectedFile(null)
      setFilePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (error: any) => showErrorToast(error, 'Erreur lors de la mise à jour'),
  })

  const [publishingId, setPublishingId] = useState<number | null>(null)
  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      setPublishingId(id)
      return api.patch(`/library/books/${id}/`, { is_published: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] })
      showSuccessToast('Livre publié')
      setPublishingId(null)
    },
    onError: (error: any) => {
      showErrorToast(error, 'Erreur lors de la publication')
      setPublishingId(null)
    },
  })

  const onSubmit = (data: BookForm) => {
    if (editingBook) {
      updateMutation.mutate({
        id: editingBook.id,
        data: { ...data, classes: selectedClasses.length ? selectedClasses : undefined },
      })
    } else {
      createMutation.mutate(data)
    }
  }

  const openEdit = (book: any) => {
    setEditingBook(book)
    const classIds = Array.isArray(book.classes)
      ? book.classes.map((c: any) => (typeof c === 'object' && c?.id != null ? c.id : c))
      : []
    setSelectedClasses(classIds)
    reset({
      title: book.title,
      author: book.author || '',
      isbn: book.isbn || '',
      category: book.category || undefined,
      description: book.description || '',
      is_free: book.is_free ?? true,
      price: book.price ? Number(book.price) : 0,
      currency: book.currency || 'CDF',
      language: book.language || 'fr',
      pages: book.pages ? Number(book.pages) : undefined,
      is_published: book.is_published ?? false,
      book_url: book.book_url || '',
    })
    setSelectedFile(null)
    setFilePreview(null)
  }

  const getImageUrl = (book: any) => {
    if (book.cover_image) {
      // Si c'est une URL complète, la retourner telle quelle
      if (book.cover_image.startsWith('http')) {
        return book.cover_image
      }
      // Sinon, construire l'URL relative (enlever /api et ajouter le chemin media)
      const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000'
      // Si le chemin ne commence pas par /, l'ajouter
      const imagePath = book.cover_image.startsWith('/') ? book.cover_image : `/${book.cover_image}`
      return `${baseUrl}${imagePath}`
    }
    return null
  }

  const getFileUrl = (book: any) => {
    if (book.book_file) {
      // Si c'est une URL complète, la retourner telle quelle
      if (book.book_file.startsWith('http')) {
        return book.book_file
      }
      // Sinon, construire l'URL relative
      const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000'
      const filePath = book.book_file.startsWith('/') ? book.book_file : `/${book.book_file}`
      return `${baseUrl}${filePath}`
    }
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion de la Bibliothèque</h1>
        <button
          onClick={() => {
            setEditingBook(null)
            setShowForm(!showForm)
            if (showForm) {
              reset()
              setSelectedClasses([])
            }
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau livre
        </button>
      </div>

      {(showForm || editingBook) && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingBook ? 'Modifier le livre' : 'Nouveau livre'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  className="input"
                  placeholder="Titre du livre"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auteur <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('author')}
                  className="input"
                  placeholder="Auteur"
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  {...register('isbn')}
                  className="input"
                  placeholder="ISBN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select {...register('category', { valueAsNumber: true })} className="input">
                  <option value="">Sélectionner une catégorie</option>
                  {categories?.results?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classes
                </label>
                <select 
                  multiple
                  className="input"
                  style={{ minHeight: '100px' }}
                  value={selectedClasses.map(c => c.toString())}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                    setSelectedClasses(selectedOptions)
                  }}
                >
                  {classes?.results?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maintenez Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs classes. Si aucune classe n'est sélectionnée, le livre sera accessible à toutes les classes.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lien du livre
                </label>
                <input
                  {...register('book_url')}
                  type="url"
                  className="input"
                  placeholder="https://exemple.com/livre"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  URL alternative si le livre n'est pas disponible en fichier
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue
                </label>
                <select {...register('language')} className="input">
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de pages
                </label>
                <input
                  {...register('pages', { valueAsNumber: true })}
                  type="number"
                  className="input"
                  placeholder="Nombre de pages"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise
                </label>
                <select {...register('currency')} className="input">
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    {...register('is_free')}
                    type="checkbox"
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Gratuit</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    {...register('is_published')}
                    type="checkbox"
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Publié</span>
                </label>
              </div>
              {!isFree && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="Prix"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                className="input"
                rows={4}
                placeholder="Description du livre"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier du livre (PDF)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary-500 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="book-file"
                      className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Télécharger un fichier</span>
                      <input
                        id="book-file"
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.epub,.mobi"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">ou glissez-déposez</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF, EPUB, MOBI jusqu'à 50MB
                  </p>
                  {filePreview && (
                    <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
                      {filePreview}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                La première page du PDF sera automatiquement extraite comme image de couverture si aucune image n'est fournie.
              </p>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingBook(null)
                  reset()
                  setSelectedClasses([])
                }}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn btn-primary"
              >
                {editingBook
                  ? (updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer')
                  : (createMutation.isPending ? 'Création...' : 'Créer le livre')}
              </button>
            </div>
          </form>
        </Card>
      )}

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
                    <p className="text-xs text-primary-600 dark:text-primary-400 mb-3">
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
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Page {allProgress[book.id].current_page || 0} sur {allProgress[book.id].total_pages || book.pages || 0}
                      </p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openEdit(book)}
                      className="btn btn-secondary text-sm py-2 px-3 flex items-center gap-1"
                      title="Éditer"
                    >
                      <Pencil className="w-4 h-4" />
                      Éditer
                    </button>
                    {!book.is_published && (
                      <button
                        onClick={() => publishMutation.mutate(book.id)}
                        disabled={publishingId === book.id}
                        className="btn btn-primary text-sm py-2 px-3 flex items-center gap-1"
                        title="Publier"
                      >
                        <Send className="w-4 h-4" />
                        {publishingId === book.id ? '...' : 'Publier'}
                      </button>
                    )}
                    {book.book_file && (
                      <>
                        <button
                          onClick={() => navigate(`/book/${book.id}/read`)}
                          className="flex-1 btn btn-primary text-sm py-2 flex items-center justify-center gap-2 min-w-0"
                        >
                          <Eye className="w-4 h-4" />
                          {allProgress && allProgress[book.id] ? 'Continuer' : 'Lire'}
                        </button>
                        <a
                          href={getFileUrl(book) || '#'}
                          download
                          className="btn btn-secondary text-sm py-2 px-3"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </a>
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
