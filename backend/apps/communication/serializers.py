from rest_framework import serializers
from .models import Notification, Message, SMSLog, WhatsAppLog, Announcement, ParentMeeting


class NotificationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at', 'read_at']


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['created_at', 'read_at', 'school', 'sender']  # sender et school sont assignés automatiquement dans perform_create
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True, 'read_only': True},  # Le champ school est assigné automatiquement dans perform_create
            'sender': {'required': False, 'read_only': True},  # Le champ sender est assigné automatiquement dans perform_create
            'recipient': {'required': True}  # Le destinataire doit être fourni
        }


class SMSLogSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = SMSLog
        fields = '__all__'
        read_only_fields = ['created_at', 'sent_at', 'delivered_at']


class WhatsAppLogSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = WhatsAppLog
        fields = '__all__'
        read_only_fields = ['created_at', 'sent_at', 'delivered_at', 'read_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'published_at', 'school']  # school est assigné automatiquement dans perform_create
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True, 'read_only': True}  # Le champ school est assigné automatiquement dans perform_create
        }


class ParentMeetingSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    parent_name = serializers.CharField(source='parent.user.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    
    class Meta:
        model = ParentMeeting
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
