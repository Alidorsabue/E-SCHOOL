"""
Tutoring/Home support models
"""
from django.db import models
from apps.accounts.models import User, Teacher, Parent, Student
from apps.schools.models import School


class TutoringMessage(models.Model):
    """Model for messages between parents and teachers for home support"""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_tutoring_messages', verbose_name="Expéditeur")
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_tutoring_messages', verbose_name="Destinataire")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='tutoring_messages', verbose_name="Élève")
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='tutoring_messages', verbose_name="École")
    
    subject = models.CharField(max_length=200, verbose_name="Sujet")
    message = models.TextField(verbose_name="Message")
    
    # Message type
    message_type = models.CharField(max_length=20, choices=[
        ('QUESTION', 'Question'),
        ('ADVICE', 'Conseil'),
        ('UPDATE', 'Mise à jour'),
        ('CONCERN', 'Préoccupation'),
        ('GENERAL', 'Général'),
    ], default='GENERAL', verbose_name="Type de message")
    
    # Status
    is_read = models.BooleanField(default=False, verbose_name="Lu")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Lu le")
    is_important = models.BooleanField(default=False, verbose_name="Important")
    
    # Attachments
    attachment = models.FileField(upload_to='tutoring/attachments/', null=True, blank=True, verbose_name="Pièce jointe")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Message d'encadrement"
        verbose_name_plural = "Messages d'encadrement"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subject} - {self.sender.get_full_name()} -> {self.recipient.get_full_name()}"


class PedagogicalAdvice(models.Model):
    """Model for pedagogical advice from teachers to parents"""
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='pedagogical_advices', verbose_name="Enseignant")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='pedagogical_advices', verbose_name="Élève")
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='pedagogical_advices', verbose_name="École")
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    advice = models.TextField(verbose_name="Conseil pédagogique")
    
    # Category
    category = models.CharField(max_length=50, choices=[
        ('STUDY_HABITS', 'Habitudes d\'étude'),
        ('HOMEWORK', 'Devoirs'),
        ('BEHAVIOR', 'Comportement'),
        ('LEARNING', 'Apprentissage'),
        ('MOTIVATION', 'Motivation'),
        ('OTHER', 'Autre'),
    ], default='OTHER', verbose_name="Catégorie")
    
    # Resources
    resources = models.TextField(null=True, blank=True, verbose_name="Ressources recommandées")
    links = models.JSONField(null=True, blank=True, verbose_name="Liens utiles")
    
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Conseil pédagogique"
        verbose_name_plural = "Conseils pédagogiques"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.student.user.get_full_name()}"


class TutoringReport(models.Model):
    """Model for tutoring/home support reports"""
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='tutoring_reports', verbose_name="Enseignant")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='tutoring_reports', verbose_name="Élève")
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='tutoring_reports', verbose_name="École")
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    report_period_start = models.DateField(verbose_name="Début de période")
    report_period_end = models.DateField(verbose_name="Fin de période")
    
    # Report content
    academic_progress = models.TextField(verbose_name="Progrès académique")
    behavior_observations = models.TextField(null=True, blank=True, verbose_name="Observations comportementales")
    recommendations = models.TextField(verbose_name="Recommandations")
    parent_feedback = models.TextField(null=True, blank=True, verbose_name="Retour du parent")
    
    # Status
    is_draft = models.BooleanField(default=True, verbose_name="Brouillon")
    is_shared_with_parent = models.BooleanField(default=False, verbose_name="Partagé avec le parent")
    shared_at = models.DateTimeField(null=True, blank=True, verbose_name="Partagé le")
    
    # PDF report
    report_pdf = models.FileField(upload_to='tutoring/reports/', null=True, blank=True, verbose_name="Rapport PDF")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Rapport d'encadrement"
        verbose_name_plural = "Rapports d'encadrement"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.student.user.get_full_name()}"
