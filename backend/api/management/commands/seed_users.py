from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import SchoolSettings, UserProfile, UserRole

# Mirrors frontend/src/data/initialData.ts::INITIAL_USERS so the login screen's accounts work.
SEED_USERS = [
    {
        'name': 'Faisal Abbas', 'email': 'faisalabbas@gmail.com', 'password': 'faisal@123',
        'role': UserRole.GM, 'department': 'School Executive Directorate (Super Admin)',
        'phone': '+92 300 8451290', 'primary': True,
    },
    {
        'name': 'Fatima Noor', 'email': 'accountant@thesmartschool.edu.pk', 'password': 'accountant@123',
        'role': UserRole.ACCOUNTANT, 'department': 'Finance & Accounts Office', 'phone': '+92 321 4455667',
    },
    {
        'name': 'Prof. Asim Raza', 'email': 'hod@thesmartschool.edu.pk', 'password': 'hod@123',
        'role': UserRole.HOD, 'department': 'Academics & Departmental Oversight', 'phone': '+92 333 9988776',
    },
]


class Command(BaseCommand):
    help = 'Create the default school settings and the three role accounts used by the frontend.'

    def add_arguments(self, parser):
        parser.add_argument('--reset-passwords', action='store_true',
                            help='Reset seeded accounts to their default passwords if they already exist.')

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        SchoolSettings.load()

        for spec in SEED_USERS:
            user = User.objects.filter(email__iexact=spec['email']).first()
            if user is None:
                user = User.objects.create_user(username=spec['email'], email=spec['email'], password=spec['password'])
                status = 'created'
            elif options['reset_passwords']:
                user.set_password(spec['password'])
                user.is_active = True
                user.save()
                status = 'password reset'
            else:
                status = 'exists'

            UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    'full_name': spec['name'], 'role': spec['role'], 'department': spec['department'],
                    'phone': spec['phone'], 'is_primary_admin': spec.get('primary', False),
                },
            )
            self.stdout.write(f"  {spec['role']:<11} {spec['email']:<36} {status}")

        self.stdout.write(self.style.SUCCESS('Seed complete.'))
