from django.core.management.base import BaseCommand
from django.db import connections, DEFAULT_DB_ALIAS
from django.conf import settings
from django.core.management import call_command
import os
from django.db.utils import OperationalError


class Command(BaseCommand):
    help = 'Deletes and recreates the database, and populates it with data.'

    def handle(self, *args, **options):
        db_name = settings.DATABASES['default']['NAME']
        migration_folder = 'webmapping/migrations/'

        # Deleting migration files
        migration_path = os.path.join(settings.BASE_DIR, migration_folder)
        for file_name in os.listdir(migration_path):
            if file_name != '__init__.py' and file_name != '__pycache__':
                os.remove(os.path.join(migration_path, file_name))

        # Run database migrations
        call_command('makemigrations')
        call_command('migrate')

        # Run custom management commands to populate the database
        call_command('insert_types')
        call_command('insert_locations')
        call_command('insert_status')
        call_command('insert_infrastructures')
