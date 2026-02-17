from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchoolViewSet, SectionViewSet, SchoolClassViewSet, SubjectViewSet, ClassSubjectViewSet

router = DefaultRouter()
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'classes', SchoolClassViewSet, basename='schoolclass')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'class-subjects', ClassSubjectViewSet, basename='classsubject')
router.register(r'', SchoolViewSet, basename='school')

urlpatterns = [
    path('', include(router.urls)),
]
