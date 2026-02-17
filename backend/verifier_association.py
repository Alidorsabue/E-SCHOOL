"""
Script pour vérifier l'association utilisateur-école
Usage: python manage.py shell
Puis: exec(open('verifier_association.py').read())
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.schools.models import School
from apps.accounts.models import User


def verifier_association():
    """Vérifie l'association des utilisateurs ADMIN aux écoles"""
    
    print("=" * 60)
    print("Vérification des associations utilisateur-école")
    print("=" * 60)
    print()
    
    # Lister toutes les écoles
    schools = School.objects.all()
    print(f"📚 Écoles dans la base de données : {schools.count()}")
    for school in schools:
        print(f"   - {school.name} (Code: {school.code}, ID: {school.id})")
    print()
    
    # Lister tous les utilisateurs ADMIN
    admins = User.objects.filter(role='ADMIN')
    print(f"👤 Utilisateurs ADMIN : {admins.count()}")
    print()
    
    for admin in admins:
        print(f"   Utilisateur: {admin.username}")
        print(f"   Email: {admin.email or 'N/A'}")
        print(f"   Rôle: {admin.role}")
        if admin.school:
            print(f"   ✅ École associée: {admin.school.name} (ID: {admin.school.id})")
        else:
            print(f"   ❌ Aucune école associée")
        print()
    
    # Statistiques
    admins_with_school = admins.filter(school__isnull=False).count()
    admins_without_school = admins.filter(school__isnull=True).count()
    
    print("=" * 60)
    print("Résumé :")
    print("=" * 60)
    print(f"   Utilisateurs ADMIN avec école : {admins_with_school}")
    print(f"   Utilisateurs ADMIN sans école : {admins_without_school}")
    print()
    
    if admins_without_school > 0:
        print("⚠️  ATTENTION : Certains utilisateurs ADMIN n'ont pas d'école associée !")
        print("   Utilisez le script 'associate_admin_to_school.py' pour les associer.")
    else:
        print("✅ Tous les utilisateurs ADMIN ont une école associée.")
        print()
        print("Si l'erreur persiste après déconnexion/reconnexion :")
        print("   1. Vérifiez que vous utilisez le bon utilisateur pour vous connecter")
        print("   2. Vérifiez les logs du serveur Django pour voir les messages DEBUG")
        print("   3. Vérifiez que le token JWT a été mis à jour après la reconnexion")


if __name__ == '__main__':
    verifier_association()
