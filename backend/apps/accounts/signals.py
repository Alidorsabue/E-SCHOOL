"""
Signals pour le modèle User
"""
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission
from .models import User


@receiver(pre_save, sender=User)
def auto_activate_staff_for_school_admin(sender, instance, **kwargs):
    """
    Active automatiquement is_staff pour les administrateurs d'école
    afin qu'ils puissent accéder à Django Admin
    """
    if instance.is_admin and instance.school:
        instance.is_staff = True


@receiver(post_save, sender=User)
def grant_admin_permissions_to_school_admin(sender, instance, created, **kwargs):
    """
    Donne automatiquement toutes les permissions nécessaires aux administrateurs d'école
    pour qu'ils puissent voir et modifier les objets dans Django Admin
    """
    if instance.is_admin and instance.school and instance.is_staff:
        # Donner toutes les permissions à l'administrateur d'école
        # Cela permet d'accéder à tous les modèles dans Django Admin
        # Le filtrage par école sera géré par SchoolScopedAdminMixin
        
        # Récupérer toutes les permissions de contenu
        content_types = ContentType.objects.all()
        permissions = Permission.objects.filter(content_type__in=content_types)
        
        # Assigner toutes les permissions à l'utilisateur
        instance.user_permissions.set(permissions)
