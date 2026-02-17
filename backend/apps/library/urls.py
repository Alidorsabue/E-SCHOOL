from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookCategoryViewSet, BookViewSet, BookPurchaseViewSet, 
    ReadingProgressViewSet, BookAnnotationViewSet, BookNoteViewSet
)

router = DefaultRouter()
router.register(r'categories', BookCategoryViewSet, basename='book-category')
router.register(r'books', BookViewSet, basename='book')
router.register(r'purchases', BookPurchaseViewSet, basename='book-purchase')
router.register(r'progress', ReadingProgressViewSet, basename='reading-progress')
router.register(r'annotations', BookAnnotationViewSet, basename='book-annotation')
router.register(r'notes', BookNoteViewSet, basename='book-note')

urlpatterns = [
    path('', include(router.urls)),
]
