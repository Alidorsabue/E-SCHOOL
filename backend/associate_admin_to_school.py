"""
Script pour associer l'utilisateur ADMIN à une école existante
Usage: python manage.py shell
Puis: exec(open('associate_admin_to_school.py').read())
"""
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.schools.models import School
from apps.accounts.models import User


def associate_admin_to_school():
    """Associe l'utilisateur ADMIN à une école existante"""
    
    # Lister toutes les écoles
    schools = School.objects.all()
    
    if not schools.exists():
        print("❌ Aucune école trouvée dans la base de données.")
        print("   Veuillez d'abord créer une école via l'admin Django.")
        return None
    
    print("=" * 60)
    print("Écoles disponibles :")
    print("=" * 60)
    for i, school in enumerate(schools, 1):
        print(f"{i}. {school.name} (Code: {school.code}, ID: {school.id})")
    print()
    
    # Si une seule école, l'utiliser automatiquement
    if schools.count() == 1:
        school = schools.first()
        print(f"✓ École sélectionnée automatiquement : {school.name}")
    else:
        # Demander à l'utilisateur de choisir
        choice = input("Entrez le numéro de l'école à utiliser (ou appuyez sur Entrée pour la première) : ").strip()
        if choice:
            try:
                school = schools[int(choice) - 1]
            except (ValueError, IndexError):
                print("❌ Choix invalide, utilisation de la première école")
                school = schools.first()
        else:
            school = schools.first()
    
    print()
    print("=" * 60)
    print(f"Recherche des utilisateurs ADMIN sans école...")
    print("=" * 60)
    
    # Trouver tous les utilisateurs ADMIN
    all_admins = User.objects.filter(role='ADMIN')
    print(f"Total utilisateurs ADMIN trouvés : {all_admins.count()}")
    
    # Utilisateurs ADMIN sans école
    admins_without_school = all_admins.filter(school__isnull=True)
    
    if admins_without_school.exists():
        print(f"\n✓ {admins_without_school.count()} utilisateur(s) ADMIN sans école trouvé(s) :")
        for admin in admins_without_school:
            print(f"   - {admin.username} ({admin.email or 'pas d\'email'})")
        
        print(f"\nAssociation à l'école '{school.name}'...")
        count = 0
        for admin in admins_without_school:
            admin.school = school
            admin.save()
            count += 1
            print(f"✓ {admin.username} associé à {school.name}")
        
        print(f"\n✅ {count} utilisateur(s) ADMIN associé(s) avec succès !")
    else:
        # Vérifier si des admins ont déjà une école
        admins_with_school = all_admins.filter(school__isnull=False)
        if admins_with_school.exists():
            print(f"\n✓ {admins_with_school.count()} utilisateur(s) ADMIN ont déjà une école :")
            for admin in admins_with_school:
                print(f"   - {admin.username} → {admin.school.name if admin.school else 'Aucune'}")
        else:
            print("\n⚠ Aucun utilisateur ADMIN trouvé")
            print("   Créez d'abord un utilisateur avec le rôle ADMIN")
    
    return school


if __name__ == '__main__':
    print()
    print("=" * 60)
    print("Association des utilisateurs ADMIN à une école")
    print("=" * 60)
    print()
    
    school = associate_admin_to_school()
    
    if school:
        print()
        print("=" * 60)
        print("✅ Terminé !")
        print("=" * 60)
        print()
        print("Vous pouvez maintenant créer des classes dans l'application.")
        print("Si vous êtes déjà connecté, déconnectez-vous et reconnectez-vous")
        print("pour que les changements prennent effet.")
    print()
