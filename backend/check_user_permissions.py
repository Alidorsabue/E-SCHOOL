"""
Script pour vérifier et corriger les permissions d'un utilisateur dans Django Admin
"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission


def check_and_fix_user(username):
    """Vérifie et corrige les permissions d'un utilisateur"""
    try:
        user = User.objects.get(username=username)
        
        print(f"\n[INFO] Utilisateur: {username}")
        print(f"   Role: {user.get_role_display()}")
        print(f"   Ecole: {user.school.name if user.school else 'Aucune'}")
        print(f"   is_staff: {user.is_staff}")
        print(f"   is_superuser: {user.is_superuser}")
        print(f"   is_active: {user.is_active}")
        print(f"   Permissions: {user.user_permissions.count()}")
        
        if user.is_admin and user.school:
            print(f"\n[ACTION] Activation de l'acces Django Admin...")
            
            # Activer is_staff
            if not user.is_staff:
                user.is_staff = True
                print(f"   -> is_staff active")
            
            # Donner toutes les permissions
            content_types = ContentType.objects.all()
            permissions = Permission.objects.filter(content_type__in=content_types)
            user.user_permissions.set(permissions)
            
            user.save()
            
            print(f"   -> {permissions.count()} permissions assignees")
            print(f"\n[SUCCES] L'utilisateur {username} peut maintenant acceder a Django Admin")
            print(f"   URL: http://localhost:8000/admin/")
            print(f"\n[IMPORTANT] Deconnectez-vous et reconnectez-vous pour que les changements prennent effet.")
            return True
        else:
            print(f"\n[ERREUR] L'utilisateur n'est pas un administrateur d'ecole ou n'a pas d'ecole associee")
            return False
            
    except User.DoesNotExist:
        print(f"[ERREUR] L'utilisateur '{username}' n'existe pas")
        print(f"\n[Liste] Utilisateurs existants:")
        users = User.objects.all()[:10]
        for u in users:
            print(f"   - {u.username} ({u.get_role_display()})")
        return False
    except Exception as e:
        print(f"[ERREUR] {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    if len(sys.argv) > 1:
        check_and_fix_user(sys.argv[1])
    else:
        username = input("Nom d'utilisateur: ").strip()
        if username:
            check_and_fix_user(username)
