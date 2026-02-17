from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import models
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import FileResponse, Http404
from django.conf import settings
from PIL import Image
import io
import os
from .models import BookCategory, Book, BookPurchase, ReadingProgress, BookAnnotation, BookNote
from .serializers import (
    BookCategorySerializer, BookSerializer, BookPurchaseSerializer, 
    ReadingProgressSerializer, BookAnnotationSerializer, BookNoteSerializer
)


class BookCategoryViewSet(viewsets.ModelViewSet):
    queryset = BookCategory.objects.all()
    serializer_class = BookCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name']


class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Support pour l'upload de fichiers
    filterset_fields = ['category', 'is_free', 'is_published', 'school', 'language']
    search_fields = ['title', 'author', 'isbn', 'description']
    
    def get_queryset(self):
        # Pour les admins et enseignants, afficher tous les livres (publiés et non publiés)
        if self.request.user.is_admin or self.request.user.is_teacher:
            queryset = Book.objects.all()
        else:
            queryset = Book.objects.filter(is_published=True)
        
        # Filter by school if user has a school
        if self.request.user.school:
            queryset = queryset.filter(
                models.Q(school=self.request.user.school) | models.Q(school__isnull=True)
            )
        
        # Pour les élèves, filtrer par classe
        if self.request.user.is_student:
            try:
                student_profile = self.request.user.student_profile
                if student_profile and student_profile.school_class:
                    # Les élèves voient seulement les livres de leur classe ou les livres sans classe spécifiée
                    from django.db.models import Count
                    # Livres qui ont la classe de l'élève OU qui n'ont aucune classe assignée
                    queryset = queryset.annotate(
                        classes_count=Count('classes')
                    ).filter(
                        models.Q(classes=student_profile.school_class) | models.Q(classes_count=0)
                    ).distinct()
                else:
                    # Si l'élève n'a pas de classe assignée, ne voir que les livres sans classe spécifiée
                    from django.db.models import Count
                    queryset = queryset.annotate(
                        classes_count=Count('classes')
                    ).filter(classes_count=0)
            except Exception as e:
                # Si l'élève n'a pas de profil, ne voir que les livres sans classe spécifiée
                from django.db.models import Count
                queryset = queryset.annotate(
                    classes_count=Count('classes')
                ).filter(classes_count=0)
        
        return queryset
    
    def extract_pdf_first_page(self, pdf_file):
        """Extrait la première page d'un PDF et la convertit en image. Retourne (buffer_image, nombre_pages)"""
        try:
            import fitz  # PyMuPDF
            # Lire le contenu du fichier
            pdf_content = pdf_file.read()
            # Réinitialiser la position du fichier
            pdf_file.seek(0)
            
            # Ouvrir le PDF depuis le contenu
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            num_pages = len(pdf_document)
            
            if num_pages == 0:
                pdf_document.close()
                return None, 0
            
            # Obtenir la première page
            first_page = pdf_document[0]
            
            # Convertir la page en image (matrice de pixels)
            # zoom pour une meilleure qualité
            zoom = 2.0
            mat = fitz.Matrix(zoom, zoom)
            pix = first_page.get_pixmap(matrix=mat)
            
            # Convertir en PIL Image
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            # Convertir en RGB si nécessaire
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Redimensionner si trop grand (max 800px de largeur)
            max_width = 800
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Sauvegarder dans un buffer
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            
            pdf_document.close()
            return buffer, num_pages
            
        except ImportError:
            # PyMuPDF n'est pas installé
            return None, 0
        except Exception as e:
            print(f"Erreur lors de l'extraction de la première page du PDF: {str(e)}")
            return None, 0
    
    def perform_create(self, serializer):
        """Automatically assign the book to the user's school and extract cover from PDF"""
        book_file = self.request.FILES.get('book_file')
        cover_image = self.request.FILES.get('cover_image')
        num_pages = None
        
        # Si un fichier PDF est fourni et qu'aucune image de couverture n'est fournie
        if book_file and not cover_image:
            # Vérifier si c'est un PDF
            if book_file.name.lower().endswith('.pdf'):
                # Extraire la première page et obtenir le nombre de pages
                cover_buffer, num_pages = self.extract_pdf_first_page(book_file)
                if cover_buffer:
                    # Créer un nom de fichier pour l'image de couverture
                    cover_filename = f"{os.path.splitext(book_file.name)[0]}_cover.jpg"
                    cover_image = ContentFile(cover_buffer.read(), name=cover_filename)
        
        # Préparer les données pour la sauvegarde
        save_data = {}
        if book_file:
            save_data['book_file'] = book_file
        if cover_image:
            save_data['cover_image'] = cover_image
        
        # Ajouter le nombre de pages si extrait du PDF et non fourni dans le formulaire
        if num_pages and 'pages' not in self.request.data:
            # Modifier directement les données validées
            serializer.validated_data['pages'] = num_pages
        
        # Sauvegarder le livre
        if self.request.user.school:
            book = serializer.save(
                school=self.request.user.school,
                **save_data
            )
        else:
            book = serializer.save(**save_data)
        
        # Gérer les classes associées (ManyToMany doit être fait après la sauvegarde)
        classes_ids = []
        # Essayer getlist d'abord (pour FormData)
        if hasattr(self.request.data, 'getlist'):
            classes_ids = self.request.data.getlist('classes', [])
        else:
            # Sinon utiliser get
            classes_data = self.request.data.get('classes', [])
            if isinstance(classes_data, list):
                classes_ids = classes_data
            elif isinstance(classes_data, str):
                # Si c'est une chaîne, essayer de la parser
                import json
                try:
                    classes_ids = json.loads(classes_data)
                except:
                    classes_ids = [int(cid) for cid in classes_data.split(',') if cid.strip()]
        
        # Convertir en entiers
        if classes_ids:
            try:
                classes_ids = [int(cid) for cid in classes_ids if cid and str(cid).isdigit()]
            except (ValueError, TypeError):
                classes_ids = []
        
        # Associer les classes au livre
        if classes_ids:
            from apps.schools.models import SchoolClass
            if self.request.user.school:
                classes = SchoolClass.objects.filter(id__in=classes_ids, school=self.request.user.school)
            else:
                classes = SchoolClass.objects.filter(id__in=classes_ids)
            book.classes.set(classes)

    def perform_update(self, serializer):
        """Handle classes ManyToMany on update when provided"""
        book = serializer.save()
        has_classes = 'classes' in self.request.data or (hasattr(self.request.data, 'getlist') and self.request.data.getlist('classes'))
        if not has_classes:
            return
        classes_ids = []
        if hasattr(self.request.data, 'getlist'):
            raw = self.request.data.getlist('classes', [])
            classes_ids = [x for x in raw if x not in (None, '', '[]')]
        else:
            classes_data = self.request.data.get('classes', [])
            if isinstance(classes_data, list):
                classes_ids = classes_data
            elif isinstance(classes_data, str):
                import json
                try:
                    classes_ids = json.loads(classes_data) if classes_data else []
                except Exception:
                    classes_ids = [int(cid) for cid in classes_data.split(',') if cid.strip()] if classes_data else []
        try:
            classes_ids = [int(cid) for cid in classes_ids if cid is not None and cid != '' and str(cid).replace('.', '').isdigit()]
        except (ValueError, TypeError):
            classes_ids = []
        from apps.schools.models import SchoolClass
        if self.request.user.school:
            classes = SchoolClass.objects.filter(id__in=classes_ids, school=self.request.user.school)
        else:
            classes = SchoolClass.objects.filter(id__in=classes_ids)
        book.classes.set(classes)
    
    @action(detail=True, methods=['post'])
    def purchase(self, request, pk=None):
        """Purchase a book"""
        book = self.get_object()
        
        if book.is_free:
            # Free book - create purchase record
            purchase, created = BookPurchase.objects.get_or_create(
                book=book,
                user=request.user,
                defaults={
                    'amount_paid': 0,
                    'payment_status': 'COMPLETED'
                }
            )
            return Response(BookPurchaseSerializer(purchase).data, status=status.HTTP_201_CREATED)
        else:
            # Paid book - create pending purchase (payment will be handled by payments app)
            purchase = BookPurchase.objects.create(
                book=book,
                user=request.user,
                amount_paid=book.price,
                payment_status='PENDING'
            )
            return Response({
                'purchase': BookPurchaseSerializer(purchase).data,
                'payment_required': True,
                'amount': book.price
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update reading progress"""
        book = self.get_object()
        current_page = request.data.get('current_page', 0)
        total_pages = request.data.get('total_pages', book.pages)
        
        progress, created = ReadingProgress.objects.get_or_create(
            book=book,
            user=request.user,
            defaults={
                'current_page': current_page,
                'total_pages': total_pages,
                'progress_percentage': (current_page / total_pages * 100) if total_pages else 0
            }
        )
        
        if not created:
            progress.current_page = current_page
            if total_pages:
                progress.total_pages = total_pages
                progress.progress_percentage = (current_page / total_pages * 100)
            progress.save()
        
        return Response(ReadingProgressSerializer(progress).data)
    
    @action(detail=True, methods=['post'])
    def increment_view(self, request, pk=None):
        """Increment view count"""
        book = self.get_object()
        book.view_count += 1
        book.save()
        return Response({'view_count': book.view_count})
    
    @action(detail=True, methods=['get'])
    def download_file(self, request, pk=None):
        """Serve book file with authentication"""
        book = self.get_object()
        if not book.book_file:
            raise Http404("Fichier non disponible")
        
        # Vérifier que l'utilisateur a accès au livre
        # (déjà vérifié par les permissions IsAuthenticated)
        
        try:
            file_path = book.book_file.path
            if not os.path.exists(file_path):
                raise Http404("Fichier introuvable")
            
            # Déterminer le content type
            content_type = 'application/pdf'
            if file_path.endswith('.doc') or file_path.endswith('.docx'):
                content_type = 'application/msword'
            elif file_path.endswith('.epub'):
                content_type = 'application/epub+zip'
            
            response = FileResponse(
                open(file_path, 'rb'),
                content_type=content_type
            )
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(book.book_file.name)}"'
            return response
        except ValueError:
            # Si le fichier n'a pas de path (stockage cloud), utiliser l'URL
            if book.book_file.url:
                from django.http import HttpResponseRedirect
                return HttpResponseRedirect(book.book_file.url)
            raise Http404("Fichier non disponible")


class BookPurchaseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BookPurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['book', 'user', 'payment_status']
    
    def get_queryset(self):
        queryset = BookPurchase.objects.all()
        # Users can only see their own purchases
        if not self.request.user.is_admin:
            queryset = queryset.filter(user=self.request.user)
        return queryset


class ReadingProgressViewSet(viewsets.ModelViewSet):
    serializer_class = ReadingProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['book', 'user']
    
    def get_queryset(self):
        queryset = ReadingProgress.objects.all()
        # Users can only see their own progress
        if not self.request.user.is_admin:
            queryset = queryset.filter(user=self.request.user)
        return queryset


class BookAnnotationViewSet(viewsets.ModelViewSet):
    serializer_class = BookAnnotationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['book', 'user', 'page_number']
    
    def get_queryset(self):
        queryset = BookAnnotation.objects.all()
        # Users can only see their own annotations
        if not self.request.user.is_admin:
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookNoteViewSet(viewsets.ModelViewSet):
    serializer_class = BookNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['book', 'user']
    
    def get_queryset(self):
        queryset = BookNote.objects.all()
        # Users can only see their own notes
        if not self.request.user.is_admin:
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
