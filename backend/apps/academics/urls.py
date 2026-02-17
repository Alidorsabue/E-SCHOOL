from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet, GradeViewSet, GradeBulletinViewSet, AttendanceViewSet,
    DisciplineRecordViewSet, DisciplineRequestViewSet, ReportCardViewSet
)

router = DefaultRouter()
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'grade-bulletins', GradeBulletinViewSet, basename='grade-bulletin')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'discipline', DisciplineRecordViewSet, basename='discipline')
router.register(r'discipline-requests', DisciplineRequestViewSet, basename='discipline-request')
router.register(r'report-cards', ReportCardViewSet, basename='report-card')

urlpatterns = [
    path('', include(router.urls)),
]
