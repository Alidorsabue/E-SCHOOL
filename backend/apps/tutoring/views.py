from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import TutoringMessage, PedagogicalAdvice, TutoringReport
from .serializers import (
    TutoringMessageSerializer, PedagogicalAdviceSerializer, TutoringReportSerializer
)


class TutoringMessageViewSet(viewsets.ModelViewSet):
    serializer_class = TutoringMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['sender', 'recipient', 'student', 'message_type', 'is_read', 'school']
    search_fields = ['subject', 'message']
    
    def get_queryset(self):
        queryset = TutoringMessage.objects.all()
        if self.request.user.school:
            queryset = queryset.filter(school=self.request.user.school)
        
        # Users can only see messages they sent or received
        if not self.request.user.is_admin:
            queryset = queryset.filter(
                Q(sender=self.request.user) | Q(recipient=self.request.user)
            )
        return queryset
    
    def perform_create(self, serializer):
        # Déterminer le destinataire si non fourni
        # Si c'est un parent qui envoie, le destinataire est l'enseignant titulaire de l'élève
        recipient = serializer.validated_data.get('recipient')
        student = serializer.validated_data.get('student')
        
        if not recipient:
            if self.request.user.is_parent:
                # Pour un parent, le destinataire est l'enseignant titulaire de l'élève
                if student and hasattr(student, 'school_class') and student.school_class and student.school_class.titulaire:
                    recipient = student.school_class.titulaire.user
            elif self.request.user.is_teacher:
                # Pour un enseignant, le destinataire est le parent de l'élève
                if student and hasattr(student, 'parent') and student.parent:
                    recipient = student.parent
        
        # Si aucun destinataire n'a été trouvé, utiliser l'utilisateur actuel comme fallback
        if not recipient:
            recipient = self.request.user
        
        serializer.save(
            sender=self.request.user,
            recipient=recipient,
            school=self.request.user.school
        )
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark message as read"""
        message = self.get_object()
        if message.recipient == request.user:
            message.is_read = True
            message.read_at = timezone.now()
            message.save()
        return Response(TutoringMessageSerializer(message).data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread messages"""
        count = TutoringMessage.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': count})


class PedagogicalAdviceViewSet(viewsets.ModelViewSet):
    serializer_class = PedagogicalAdviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['teacher', 'student', 'category', 'is_active', 'school']
    search_fields = ['title', 'advice']
    
    def get_queryset(self):
        queryset = PedagogicalAdvice.objects.filter(is_active=True)
        if self.request.user.school:
            queryset = queryset.filter(school=self.request.user.school)
        
        # Teachers can only see their own advice
        if self.request.user.is_teacher:
            from apps.accounts.models import Teacher
            try:
                teacher = Teacher.objects.get(user=self.request.user)
                queryset = queryset.filter(teacher=teacher)
            except Teacher.DoesNotExist:
                queryset = queryset.none()
        # Parents can only see advice for their children
        elif self.request.user.is_parent:
            queryset = queryset.filter(student__parent=self.request.user)
        # Students can only see advice for themselves
        elif self.request.user.is_student:
            queryset = queryset.filter(student__user=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        """Automatically assign the advice to the user's school and teacher"""
        from apps.accounts.models import Teacher
        # Si l'utilisateur est un enseignant, assigner automatiquement
        if self.request.user.is_teacher:
            try:
                teacher = Teacher.objects.get(user=self.request.user)
                serializer.save(school=self.request.user.school, teacher=teacher)
            except Teacher.DoesNotExist:
                serializer.save(school=self.request.user.school)
        else:
            serializer.save(school=self.request.user.school)


class TutoringReportViewSet(viewsets.ModelViewSet):
    serializer_class = TutoringReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['teacher', 'student', 'is_draft', 'is_shared_with_parent', 'school']
    search_fields = ['title', 'academic_progress']
    
    def get_queryset(self):
        queryset = TutoringReport.objects.all()
        if self.request.user.school:
            queryset = queryset.filter(school=self.request.user.school)
        
        # Teachers can only see their own reports
        if self.request.user.is_teacher:
            from apps.accounts.models import Teacher
            try:
                teacher = Teacher.objects.get(user=self.request.user)
                queryset = queryset.filter(teacher=teacher)
            except Teacher.DoesNotExist:
                queryset = queryset.none()
        # Parents can only see reports shared with them
        elif self.request.user.is_parent:
            queryset = queryset.filter(
                student__parent=self.request.user,
                is_shared_with_parent=True
            )
        # Students can only see reports shared with their parents
        elif self.request.user.is_student:
            queryset = queryset.filter(
                student__user=self.request.user,
                is_shared_with_parent=True
            )
        return queryset
    
    def perform_create(self, serializer):
        """Automatically assign the report to the user's school and teacher"""
        from apps.accounts.models import Teacher
        # Si l'utilisateur est un enseignant, assigner automatiquement
        if self.request.user.is_teacher:
            try:
                teacher = Teacher.objects.get(user=self.request.user)
                serializer.save(school=self.request.user.school, teacher=teacher)
            except Teacher.DoesNotExist:
                serializer.save(school=self.request.user.school)
        else:
            serializer.save(school=self.request.user.school)
    
    @action(detail=True, methods=['post'])
    def share_with_parent(self, request, pk=None):
        """Share report with parent"""
        report = self.get_object()
        report.is_shared_with_parent = True
        report.shared_at = timezone.now()
        report.is_draft = False
        report.save()
        
        # Generate PDF if not exists
        if not report.report_pdf:
            from .utils import generate_tutoring_report_pdf
            try:
                pdf_file = generate_tutoring_report_pdf(report)
                report.report_pdf = pdf_file
                report.save()
            except Exception as e:
                pass
        
        return Response(TutoringReportSerializer(report).data)
    
    @action(detail=True, methods=['post'])
    def add_parent_feedback(self, request, pk=None):
        """Add parent feedback to report"""
        report = self.get_object()
        if not report.is_shared_with_parent:
            return Response({'error': 'Report not shared with parent'}, status=status.HTTP_400_BAD_REQUEST)
        
        report.parent_feedback = request.data.get('feedback', '')
        report.save()
        return Response(TutoringReportSerializer(report).data)
