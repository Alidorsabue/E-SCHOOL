from rest_framework import serializers
from .models import TutoringMessage, PedagogicalAdvice, TutoringReport


class TutoringMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = TutoringMessage
        fields = '__all__'
        read_only_fields = ['sender', 'recipient', 'created_at', 'updated_at', 'read_at', 'school']  # sender et recipient sont assignés automatiquement dans perform_create
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True, 'read_only': True},  # Le champ school est assigné automatiquement dans perform_create
            'sender': {'required': False, 'allow_null': True, 'read_only': True},  # Le champ sender est assigné automatiquement dans perform_create
            'recipient': {'required': False, 'allow_null': True, 'read_only': True},  # Le champ recipient est assigné automatiquement dans perform_create
        }


class PedagogicalAdviceSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = PedagogicalAdvice
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'school']  # school et teacher sont assignés automatiquement dans perform_create
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True, 'read_only': True},  # Le champ school est assigné automatiquement dans perform_create
            'teacher': {'required': False, 'allow_null': True},  # Le champ teacher est assigné automatiquement dans perform_create pour les enseignants
        }


class TutoringReportSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = TutoringReport
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'shared_at', 'school']  # school et teacher sont assignés automatiquement dans perform_create
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True, 'read_only': True},  # Le champ school est assigné automatiquement dans perform_create
            'teacher': {'required': False, 'allow_null': True},  # Le champ teacher est assigné automatiquement dans perform_create pour les enseignants
        }
