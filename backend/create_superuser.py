"""
Script pour creer un superutilisateur avec tous les champs requis
"""
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

def create_superuser():
    """Cree un superutilisateur"""
    username = input("Nom d'utilisateur: ")
    email = input("Adresse electronique: ")
    role = input("Role (ADMIN/TEACHER/PARENT/STUDENT): ").upper()
    
    # Valider le role
    valid_roles = ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT']
    if role not in valid_roles:
        print(f"Role invalide. Utilisez l'un de: {', '.join(valid_roles)}")
        return
    
    # Verifier si l'utilisateur existe deja
    if User.objects.filter(username=username).exists():
        print(f"L'utilisateur '{username}' existe deja.")
        return
    
    # Demander le mot de passe
    password = input("Mot de passe: ")
    password2 = input("Mot de passe (confirmation): ")
    
    if password != password2:
        print("Les mots de passe ne correspondent pas.")
        return
    
    # Creer le superutilisateur
    try:
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            role=role
        )
        print(f"\n[SUCCES] Superutilisateur '{username}' cree avec succes!")
        print(f"Role: {user.get_role_display()}")
    except Exception as e:
        print(f"\n[ERREUR] Erreur lors de la creation: {e}")

if __name__ == '__main__':
    create_superuser()
