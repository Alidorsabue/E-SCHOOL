"""
Script pour activer l'accès Django Admin pour un administrateur d'école
"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User


def activate_admin_access(username):
    """Active l'accès Django Admin pour un administrateur d'école"""
    try:
        from django.contrib.contenttypes.models import ContentType
        from django.contrib.auth.models import Permission
        
        user = User.objects.get(username=username)
        
        if not user.is_admin:
            print(f"[ERREUR] {username} n'est pas un administrateur d'école")
            print(f"   Role actuel: {user.get_role_display()}")
            return False
        
        if not user.school:
            print(f"[ERREUR] {username} n'est pas associe a une ecole")
            return False
        
        # Activer is_staff
        user.is_staff = True
        user.save()
        
        # Donner toutes les permissions nécessaires
        content_types = ContentType.objects.all()
        permissions = Permission.objects.filter(content_type__in=content_types)
        user.user_permissions.set(permissions)
        
        print(f"[SUCCES] Acces Django Admin active pour {username}")
        print(f"   Ecole: {user.school.name}")
        print(f"   Permissions: {permissions.count()} permissions assignees")
        print(f"   URL Admin: http://localhost:8000/admin/")
        print(f"\n[IMPORTANT] Deconnectez-vous et reconnectez-vous pour que les changements prennent effet.")
        return True
        
    except User.DoesNotExist:
        print(f"[ERREUR] L'utilisateur '{username}' n'existe pas")
        return False
    except Exception as e:
        print(f"[ERREUR] {e}")
        import traceback
        traceback.print_exc()
        return False


def list_school_admins():
    """Liste tous les administrateurs d'école"""
    admins = User.objects.filter(role='ADMIN', school__isnull=False)
    
    if not admins.exists():
        print("Aucun administrateur d'école trouvé")
        return
    
    print("\n[Liste] Liste des administrateurs d'ecole:")
    print("-" * 80)
    print(f"{'Nom d\'utilisateur':<20} {'Ecole':<30} {'is_staff':<10} {'is_active':<10}")
    print("-" * 80)
    
    for admin in admins:
        staff_status = "Oui" if admin.is_staff else "Non"
        active_status = "Oui" if admin.is_active else "Non"
        print(f"{admin.username:<20} {admin.school.name[:30]:<30} {staff_status:<10} {active_status:<10}")
    
    print("-" * 80)
    print(f"\nTotal: {admins.count()} administrateur(s) d'école")


if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == '--list':
            list_school_admins()
        else:
            activate_admin_access(sys.argv[1])
    else:
        print("Usage:")
        print("  python activate_admin_access.py <username>  # Activer l'accès pour un utilisateur")
        print("  python activate_admin_access.py --list      # Lister tous les admins d'école")
        print("\nOu entrez le nom d'utilisateur interactivement:")
        username = input("Nom d'utilisateur: ").strip()
        if username:
            activate_admin_access(username)
