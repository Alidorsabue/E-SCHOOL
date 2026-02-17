"""
Digital library models (books, resources)
"""
from django.db import models
from apps.schools.models import School, SchoolClass


class BookCategory(models.Model):
    """Model for book categories"""
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom")
    description = models.TextField(null=True, blank=True, verbose_name="Description")
    
    class Meta:
        verbose_name = "Catégorie de livre"
        verbose_name_plural = "Catégories de livres"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Book(models.Model):
    """Model for digital books"""
    title = models.CharField(max_length=200, verbose_name="Titre")
    author = models.CharField(max_length=200, verbose_name="Auteur")
    isbn = models.CharField(max_length=20, null=True, blank=True, unique=True, verbose_name="ISBN")
    category = models.ForeignKey(BookCategory, on_delete=models.SET_NULL, null=True, 
                                 related_name='books', verbose_name="Catégorie")
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='books', 
                             null=True, blank=True, verbose_name="École")  # null = available to all schools
    classes = models.ManyToManyField(SchoolClass, related_name='books', blank=True, verbose_name="Classes")
    
    # Content
    description = models.TextField(verbose_name="Description")
    cover_image = models.ImageField(upload_to='books/covers/', null=True, blank=True, verbose_name="Image de couverture")
    book_file = models.FileField(upload_to='books/files/', null=True, blank=True, verbose_name="Fichier du livre")
    book_url = models.URLField(null=True, blank=True, verbose_name="Lien du livre")
    
    # Pricing
    is_free = models.BooleanField(default=True, verbose_name="Gratuit")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Prix")
    currency = models.CharField(max_length=3, default="CDF", verbose_name="Devise")
    
    # Metadata
    language = models.CharField(max_length=10, default="fr", verbose_name="Langue")
    pages = models.IntegerField(null=True, blank=True, verbose_name="Nombre de pages")
    publication_date = models.DateField(null=True, blank=True, verbose_name="Date de publication")
    
    # Status
    is_published = models.BooleanField(default=False, verbose_name="Publié")
    download_count = models.IntegerField(default=0, verbose_name="Nombre de téléchargements")
    view_count = models.IntegerField(default=0, verbose_name="Nombre de vues")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Livre"
        verbose_name_plural = "Livres"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.author}"


class BookPurchase(models.Model):
    """Model for book purchases"""
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='purchases', verbose_name="Livre")
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='book_purchases', verbose_name="Utilisateur")
    purchase_date = models.DateTimeField(auto_now_add=True, verbose_name="Date d'achat")
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant payé")
    payment_status = models.CharField(max_length=20, choices=[
        ('PENDING', 'En attente'),
        ('COMPLETED', 'Complété'),
        ('FAILED', 'Échoué'),
    ], default='PENDING', verbose_name="Statut du paiement")
    
    class Meta:
        verbose_name = "Achat de livre"
        verbose_name_plural = "Achats de livres"
        unique_together = ['book', 'user']
        ordering = ['-purchase_date']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.book.title}"


class ReadingProgress(models.Model):
    """Model to track reading progress"""
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reading_progress', verbose_name="Livre")
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='reading_progress', verbose_name="Utilisateur")
    current_page = models.IntegerField(default=0, verbose_name="Page actuelle")
    total_pages = models.IntegerField(null=True, blank=True, verbose_name="Total pages")
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="Pourcentage de progression")
    last_read_at = models.DateTimeField(auto_now=True, verbose_name="Dernière lecture")
    
    class Meta:
        verbose_name = "Progression de lecture"
        verbose_name_plural = "Progressions de lecture"
        unique_together = ['book', 'user']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.book.title} - {self.progress_percentage}%"


class BookAnnotation(models.Model):
    """Model for page annotations"""
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='annotations', verbose_name="Livre")
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='book_annotations', verbose_name="Utilisateur")
    page_number = models.IntegerField(verbose_name="Numéro de page")
    content = models.TextField(verbose_name="Contenu de l'annotation")
    position_x = models.FloatField(null=True, blank=True, verbose_name="Position X")
    position_y = models.FloatField(null=True, blank=True, verbose_name="Position Y")
    color = models.CharField(max_length=7, default='#FFEB3B', verbose_name="Couleur")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")
    
    class Meta:
        verbose_name = "Annotation"
        verbose_name_plural = "Annotations"
        ordering = ['page_number', 'created_at']
        indexes = [
            models.Index(fields=['book', 'user', 'page_number']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.book.title} - Page {self.page_number}"


class BookNote(models.Model):
    """Model for book notes (bloc-notes)"""
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='notes', verbose_name="Livre")
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='book_notes', verbose_name="Utilisateur")
    title = models.CharField(max_length=200, null=True, blank=True, verbose_name="Titre")
    content = models.TextField(verbose_name="Contenu")
    page_reference = models.IntegerField(null=True, blank=True, verbose_name="Référence page")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")
    
    class Meta:
        verbose_name = "Note"
        verbose_name_plural = "Notes"
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['book', 'user']),
        ]
    
    def __str__(self):
        title = self.title or f"Note du {self.created_at.strftime('%d/%m/%Y')}"
        return f"{self.user.get_full_name()} - {self.book.title} - {title}"
