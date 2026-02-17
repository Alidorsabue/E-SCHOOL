"""
Unit tests for accounts app
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import TestCase
from apps.accounts.models import User, Teacher, Parent, Student
from apps.schools.models import School

User = get_user_model()


@pytest.mark.django_db
class TestUserModel(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name="Test School",
            code="TEST",
            address="Test Address",
            city="Kinshasa",
            phone="+243900000000",
            email="test@school.com"
        )
    
    def test_create_user(self):
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            role="STUDENT",
            school=self.school
        )
        assert user.username == "testuser"
        assert user.role == "STUDENT"
        assert user.school == self.school
    
    def test_user_roles(self):
        user = User.objects.create_user(
            username="teacher",
            email="teacher@example.com",
            password="testpass123",
            role="TEACHER",
            school=self.school
        )
        assert user.is_teacher == True
        assert user.is_student == False


@pytest.mark.django_db
class TestStudentModel(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name="Test School",
            code="TEST",
            address="Test Address",
            city="Kinshasa",
            phone="+243900000000",
            email="test@school.com"
        )
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="testpass123",
            role="STUDENT",
            school=self.school
        )
    
    def test_create_student(self):
        from apps.schools.models import SchoolClass
        from datetime import date
        
        school_class = SchoolClass.objects.create(
            school=self.school,
            name="1ère A",
            level="Primaire",
            grade="1ère",
            academic_year="2024-2025"
        )
        
        student = Student.objects.create(
            user=self.user,
            student_id="TEST-2024-0001",
            school_class=school_class,
            enrollment_date=date.today(),
            academic_year="2024-2025"
        )
        
        assert student.student_id == "TEST-2024-0001"
        assert student.school_class == school_class
