"""
Command to delete all fake/test data in matchmaking system
Usage:
    python manage.py delete_fake_data                 # List what will be deleted
    python manage.py delete_fake_data --confirm       # Actually delete
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from apps.matchmaking.models import OpponentRequest, MatchmakingMatch


class Command(BaseCommand):
    help = 'Delete all fake/test data in matchmaking system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of fake data',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\n⚠️  DELETING FAKE DATA\n'))

        # Find fake users
        fake_users = User.objects.filter(username__startswith='test_team_')
        
        self.stdout.write(f'🗑️  Will delete {len(fake_users)} fake users:')
        for user in fake_users:
            self.stdout.write(f'   • {user.username}')

        # Count related data
        fake_requests = OpponentRequest.objects.filter(user__in=fake_users)
        fake_matches = MatchmakingMatch.objects.filter(
            requester__in=fake_users
        ) | MatchmakingMatch.objects.filter(opponent__in=fake_users)

        self.stdout.write(f'   Will cascade delete {len(fake_requests)} opponent requests')
        self.stdout.write(f'   Will cascade delete {len(fake_matches)} matches')

        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                '\n💡 Preview mode - add --confirm to actually delete\n'
            ))
            return

        # Ask for confirmation
        confirmation = input('\n❓ Are you sure you want to delete all fake data? (yes/no): ')
        
        if confirmation.lower() != 'yes':
            self.stdout.write(self.style.SUCCESS('❌ Deletion cancelled\n'))
            return

        try:
            # Delete fake users (will cascade delete related data)
            deleted_users, _ = User.objects.filter(
                username__startswith='test_team_'
            ).delete()

            self.stdout.write(self.style.SUCCESS(
                f'\n✅ Successfully deleted {deleted_users} items from database\n'
            ))
            
            # Verify deletion
            remaining_fake_users = User.objects.filter(username__startswith='test_team_')
            self.stdout.write(f'   Remaining fake users: {len(remaining_fake_users)}')
            
            if len(remaining_fake_users) == 0:
                self.stdout.write(self.style.SUCCESS('   ✅ All fake users deleted!\n'))

        except Exception as e:
            raise CommandError(f'❌ Error deleting fake data: {str(e)}')
