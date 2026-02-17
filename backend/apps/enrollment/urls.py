from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnrollmentApplicationViewSet, ReEnrollmentViewSet

router = DefaultRouter()
router.register(r'applications', EnrollmentApplicationViewSet, basename='enrollment-application')
router.register(r'reenrollments', ReEnrollmentViewSet, basename='reenrollment')

urlpatterns = [
    path('', include(router.urls)),
]
