from rest_framework import serializers
from .models import Meeting, MeetingParticipant
from apps.accounts.serializers import UserSerializer


class MeetingParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = MeetingParticipant
        fields = '__all__'


class MeetingSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    organizer_name = serializers.CharField(source='organizer.get_full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    parent_name = serializers.CharField(source='parent.user.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    participants = MeetingParticipantSerializer(many=True, read_only=True)
    groups = serializers.SerializerMethodField()
    
    class Meta:
        model = Meeting
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'reminder_sent_at', 'published_at']
    
    def get_groups(self, obj):
        """Return list of group names"""
        return [{'id': group.id, 'name': group.name} for group in obj.groups.all()]


class MeetingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating meetings with participants"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of user IDs to add as participants"
    )
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of student IDs to add as participants"
    )
    parent_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of parent IDs to add as participants"
    )
    group_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of class/group IDs to add to the meeting"
    )
    auto_generate_video_link = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
        help_text="Automatically generate video link for Google Meet or Zoom"
    )
    
    class Meta:
        model = Meeting
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'reminder_sent_at', 'organizer', 'school', 'published_at']
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True, 'read_only': True},
            'video_link': {'required': False, 'allow_blank': True},
            'video_platform': {'required': False, 'allow_blank': True},
        }
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        student_ids = validated_data.pop('student_ids', [])
        parent_ids = validated_data.pop('parent_ids', [])
        group_ids = validated_data.pop('group_ids', [])
        auto_generate_video_link = validated_data.pop('auto_generate_video_link', False)
        
        # Handle video link generation
        if auto_generate_video_link and validated_data.get('video_platform'):
            video_data = self.generate_video_link(validated_data.get('video_platform'), validated_data.get('meeting_date'))
            if video_data:
                validated_data['video_link'] = video_data.get('link')
                validated_data['meeting_id'] = video_data.get('meeting_id')
                if video_data.get('password'):
                    validated_data['meeting_password'] = video_data.get('password')
        # If video_link is provided manually, try to extract meeting_id from Google Meet URL
        elif validated_data.get('video_link') and not validated_data.get('meeting_id'):
            video_link = validated_data.get('video_link')
            if 'meet.google.com' in video_link:
                # Extract code from Google Meet URL: https://meet.google.com/xxx-xxxx-xxx
                import re
                match = re.search(r'meet\.google\.com/([a-z0-9-]+)', video_link)
                if match:
                    validated_data['meeting_id'] = match.group(1)
        
        # Handle publication
        if validated_data.get('is_published'):
            from django.utils import timezone
            validated_data['published_at'] = timezone.now()
        
        meeting = Meeting.objects.create(**validated_data)
        
        # Add groups
        if group_ids:
            meeting.groups.set(group_ids)
            # Add all students from selected groups as participants
            from apps.accounts.models import Student
            from apps.schools.models import SchoolClass
            for group_id in group_ids:
                try:
                    school_class = SchoolClass.objects.get(id=group_id)
                    students = Student.objects.filter(school_class=school_class, user__school=meeting.school)
                    for student in students:
                        MeetingParticipant.objects.get_or_create(
                            meeting=meeting,
                            user=student.user,
                            defaults={'role': 'Élève'}
                        )
                        # Also add parent if exists (only for non-PARENT_MEETING types)
                        if student.parent and validated_data.get('meeting_type') != 'PARENT_MEETING':
                            MeetingParticipant.objects.get_or_create(
                                meeting=meeting,
                                user=student.parent,
                                defaults={'role': 'Parent'}
                            )
                except SchoolClass.DoesNotExist:
                    pass
        
        # Add individual participants
        from apps.accounts.models import User
        for user_id in participant_ids:
            try:
                user = User.objects.get(id=user_id)
                MeetingParticipant.objects.get_or_create(
                    meeting=meeting,
                    user=user,
                    defaults={'role': user.get_role_display() if hasattr(user, 'get_role_display') else 'Participant'}
                )
            except User.DoesNotExist:
                pass
        
        # Add students
        from apps.accounts.models import Student
        for student_id in student_ids:
            try:
                student = Student.objects.get(id=student_id)
                MeetingParticipant.objects.get_or_create(
                    meeting=meeting,
                    user=student.user,
                    defaults={'role': 'Élève'}
                )
                # Also add parent if exists (only for non-PARENT_MEETING types)
                if student.parent and validated_data.get('meeting_type') != 'PARENT_MEETING':
                    MeetingParticipant.objects.get_or_create(
                        meeting=meeting,
                        user=student.parent,
                        defaults={'role': 'Parent'}
                    )
            except Student.DoesNotExist:
                pass
        
        # Add parents
        from apps.accounts.models import Parent
        for parent_id in parent_ids:
            try:
                parent = Parent.objects.get(id=parent_id)
                MeetingParticipant.objects.get_or_create(
                    meeting=meeting,
                    user=parent.user,
                    defaults={'role': 'Parent'}
                )
            except Parent.DoesNotExist:
                pass
        
        return meeting
    
    def generate_video_link(self, platform, meeting_date):
        """Generate video link based on platform
        
        Returns a dict with 'link', 'meeting_id', and optionally 'password'
        """
        if not platform or not meeting_date:
            return None
        
        # For Google Meet, we can generate a simple link
        # Note: Real Google Meet links require API integration, this is a placeholder
        if platform == 'GOOGLE_MEET':
            # Format: https://meet.google.com/xxx-xxxx-xxx
            import random
            import string
            code = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
            meeting_code = f"{code[:3]}-{code[3:7]}-{code[7:]}"
            return {
                'link': f"https://meet.google.com/{meeting_code}",
                'meeting_id': meeting_code,
                'password': None  # Google Meet doesn't use passwords in the URL
            }
        
        # For Zoom, we would need API integration
        # This is a placeholder - real implementation would use Zoom API
        elif platform == 'ZOOM':
            # Generate a placeholder Zoom link with meeting ID and password
            import random
            import string
            meeting_id = ''.join(random.choices(string.digits, k=10))
            password = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            return {
                'link': f"https://zoom.us/j/{meeting_id}",
                'meeting_id': meeting_id,
                'password': password
            }
        
        return None
