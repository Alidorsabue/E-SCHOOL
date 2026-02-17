from rest_framework import serializers
from .models import EnrollmentApplication, ReEnrollment
from apps.accounts.serializers import StudentSerializer


class EnrollmentApplicationSerializer(serializers.ModelSerializer):
    school_name = serializers.SerializerMethodField()
    requested_class_name = serializers.SerializerMethodField()
    submitted_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EnrollmentApplication
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'submitted_by', 'reviewed_by', 'school']  # school est assigné automatiquement dans perform_create
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True, 'read_only': True},  # Le champ school est assigné automatiquement dans perform_create
            'photo': {'required': False, 'allow_null': True},  # Photo optionnelle
        }
    
    def get_school_name(self, obj):
        try:
            return obj.school.name if obj.school else ''
        except Exception:
            return ''
    
    def get_requested_class_name(self, obj):
        try:
            return obj.requested_class.name if obj.requested_class else ''
        except Exception:
            return ''
    
    def get_submitted_by_name(self, obj):
        try:
            return obj.submitted_by.get_full_name() if obj.submitted_by else ''
        except Exception:
            return ''
    
    def get_reviewed_by_name(self, obj):
        try:
            return obj.reviewed_by.get_full_name() if obj.reviewed_by else ''
        except Exception:
            return ''
    
    def to_representation(self, instance):
        """Override to return full URL for photo"""
        try:
            representation = super().to_representation(instance)
            if instance.photo:
                request = self.context.get('request')
                if request:
                    representation['photo'] = request.build_absolute_uri(instance.photo.url)
                else:
                    representation['photo'] = instance.photo.url
            return representation
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la sérialisation de EnrollmentApplication {instance.id}: {str(e)}")
            # Retourner une représentation de base en cas d'erreur
            return super().to_representation(instance)


class ReEnrollmentSerializer(serializers.ModelSerializer):
    student_detail = StudentSerializer(source='student', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    
    class Meta:
        model = ReEnrollment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
