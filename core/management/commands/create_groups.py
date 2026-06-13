"""
Usage:
    python manage.py create_groups

Creates or updates the four Django Groups with correct permissions.
Safe to run multiple times (idempotent).
"""

from django.core.management.base import BaseCommand
from core.rbac import create_groups


class Command(BaseCommand):
    help = "Create or update RBAC groups and permissions for ClearChart."

    def handle(self, *args, **options):
        try:
            create_groups()
            self.stdout.write(self.style.SUCCESS(
                "✓ Groups created/updated: "
                "front_desk_volunteer, undergrad_staff, "
                "student_practitioner, attending_faculty"
            ))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed: {e}"))
