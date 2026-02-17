from rest_framework import serializers
from .models import BookCategory, Book, BookPurchase, ReadingProgress, BookAnnotation, BookNote


class BookCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BookCategory
        fields = '__all__'


class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    classes_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = '__all__'
        read_only_fields = ['download_count', 'view_count', 'created_at', 'updated_at', 'school']  # school est assigné automatiquement dans perform_create
        extra_kwargs = {
            'school': {'required': False, 'allow_null': True, 'read_only': True}  # Le champ school est assigné automatiquement dans perform_create
        }
    
    def get_classes_names(self, obj):
        """Retourne la liste des noms des classes"""
        return [cls.name for cls in obj.classes.all()]


class BookPurchaseSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = BookPurchase
        fields = '__all__'
        read_only_fields = ['purchase_date']


class ReadingProgressSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = ReadingProgress
        fields = '__all__'
        read_only_fields = ['last_read_at']


class BookAnnotationSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = BookAnnotation
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class BookNoteSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = BookNote
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
