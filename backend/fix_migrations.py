"""
Script pour corriger l'historique des migrations
"""
import os
import django
from datetime import timedelta

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.utils import timezone

def fix_migration_history():
    """Corrige l'ordre des migrations dans django_migrations"""
    with connection.cursor() as cursor:
        # Vérifier si accounts.0001_initial existe
        cursor.execute("""
            SELECT id, applied FROM django_migrations 
            WHERE app = 'accounts' AND name = '0001_initial'
        """)
        accounts_result = cursor.fetchone()
        
        # Vérifier si schools.0001_initial existe
        cursor.execute("""
            SELECT id FROM django_migrations 
            WHERE app = 'schools' AND name = '0001_initial'
        """)
        schools_exists = cursor.fetchone()
        
        if accounts_result and not schools_exists:
            print("Correction de l'historique des migrations...")
            accounts_id, accounts_date = accounts_result
            
            # Supprimer accounts.0001_initial temporairement
            cursor.execute("""
                DELETE FROM django_migrations 
                WHERE app = 'accounts' AND name = '0001_initial'
            """)
            print("[OK] Enregistrement accounts.0001_initial supprime temporairement")
            
            # Ajouter schools.0001_initial avec une date antérieure
            # Utiliser la date de accounts moins 1 seconde pour respecter l'ordre
            if isinstance(accounts_date, str):
                # Pour SQLite, la date est une chaîne, on la garde telle quelle
                schools_date = accounts_date
            else:
                # Pour PostgreSQL, on soustrait 1 seconde
                schools_date = accounts_date - timedelta(seconds=1)
            
            # Utiliser les paramètres de Django qui gèrent automatiquement les placeholders
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied)
                VALUES (%s, %s, %s)
            """, ['schools', '0001_initial', schools_date])
            print("[OK] Enregistrement schools.0001_initial ajoute")
            
            # Réajouter accounts.0001_initial avec sa date originale
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied)
                VALUES (%s, %s, %s)
            """, ['accounts', '0001_initial', accounts_date])
            print("[OK] Enregistrement accounts.0001_initial reajoute")
            
            print("\n[SUCCES] Historique des migrations corrige avec succes!")
            print("Vous pouvez maintenant executer: python manage.py migrate")
        elif schools_exists:
            print("[OK] schools.0001_initial existe deja dans l'historique")
        else:
            print("[INFO] Aucune migration a corriger")

if __name__ == '__main__':
    fix_migration_history()
