from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, AssignmentViewSet, AssignmentQuestionViewSet, AssignmentSubmissionViewSet,
    QuizViewSet, QuizQuestionViewSet, QuizAttemptViewSet
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'assignment-questions', AssignmentQuestionViewSet, basename='assignment-question')
router.register(r'submissions', AssignmentSubmissionViewSet, basename='submission')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'quiz-questions', QuizQuestionViewSet, basename='quiz-question')
router.register(r'quiz-attempts', QuizAttemptViewSet, basename='quiz-attempt')

urlpatterns = [
    path('', include(router.urls)),
]
