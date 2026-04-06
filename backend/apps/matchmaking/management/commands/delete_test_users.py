"""
Command to delete specific test users and their related matchmaking data
Usage:
    python manage.py delete_test_users                 # List test users
    python manage.py delete_test_users --confirm       # Delete test users
    python manage.py delete_test_users --list-all      # List all users by category
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from apps.matchmaking.models import OpponentRequest, MatchmakingMatch


class Command(BaseCommand):
    help = 'Delete test/demo users and their matchmaking data'

    EXCLUDE_USERS = ['testuser']  # Users to always keep
    
    TEST_USER_PATTERNS = [
        'testplayer',  # testplayer, testplayer9102, etc.
        'test_',
        'player',      # player1, player2, etc.
        'demo_',
        'fake_',
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of test users',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force deletion without asking for confirmation',
        )
        parser.add_argument(
            '--list-all',
            action='store_true',
            help='List all users categorized as test/real',
        )
        parser.add_argument(
            '--pattern',
            type=str,
            help='Custom username pattern to match (e.g., "testplayer")',
        )

    def categorize_users(self):
        """Categorize users as test or real"""
        patterns = self.TEST_USER_PATTERNS
        if hasattr(self, 'custom_pattern') and self.custom_pattern:
            patterns = [self.custom_pattern]

        test_users = User.objects.none()
        for pattern in patterns:
            test_users |= User.objects.filter(username__icontains=pattern)

        # Exclude specific users that should be kept
        test_users = test_users.exclude(username__in=self.EXCLUDE_USERS)
        
        real_users = User.objects.exclude(id__in=test_users)
        return test_users, real_users

    def handle(self, *args, **options):
        if options.get('pattern'):
            self.custom_pattern = options['pattern']
        else:
            self.custom_pattern = None

        if options['list_all']:
            self.list_all_users()
            return

        test_users, real_users = self.categorize_users()

        self.stdout.write(self.style.WARNING('\n⚠️  TEST USERS ANALYSIS\n'))

        self.stdout.write(f'🧪 Test Users Found: {len(test_users)}')
        for user in test_users.order_by('username'):
            self.stdout.write(f'   • {user.username} ({user.email})')

        if len(test_users) == 0:
            self.stdout.write(self.style.SUCCESS('\n✅ No test users found!\n'))
            return

        # Count related data
        test_requests = OpponentRequest.objects.filter(user__in=test_users)
        test_matches = MatchmakingMatch.objects.filter(
            requester__in=test_users
        ) | MatchmakingMatch.objects.filter(opponent__in=test_users)

        self.stdout.write(f'\n📋 Related Data to Delete:')
        self.stdout.write(f'   • {len(test_requests)} Opponent Requests')
        self.stdout.write(f'   • {len(test_matches)} Matches')

        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                '\n💡 Preview mode - add --confirm to actually delete\n'
            ))
            return

        # Ask for final confirmation unless --force is used
        if not options['force']:
            confirmation = input(
                self.style.WARNING(
                    f'\n⚠️  Delete {len(test_users)} test users and related data? (yes/no): '
                )
            )
            if confirmation.lower() != 'yes':
                self.stdout.write(self.style.SUCCESS('❌ Deletion cancelled\n'))
                return

        try:
            # Delete test users (cascades delete related data)
            deleted_count, deleted_details = User.objects.filter(
                id__in=test_users
            ).delete()

            self.stdout.write(self.style.SUCCESS(
                f'\n✅ Successfully deleted {deleted_count} database objects\n'
            ))

            # Verify
            test_users_remaining, real_users_remaining = self.categorize_users()
            self.stdout.write(f'📊 After Deletion:')
            self.stdout.write(f'   • Test users remaining: {len(test_users_remaining)}')
            self.stdout.write(f'   • Real users: {len(real_users_remaining)}\n')

        except Exception as e:
            raise CommandError(f'❌ Error deleting test users: {str(e)}')

    def list_all_users(self):
        """List all users categorized"""
        test_users, real_users = self.categorize_users()

        self.stdout.write(self.style.SUCCESS('\n👥 USER CATEGORIZATION\n'))

        self.stdout.write(self.style.WARNING(f'🧪 TEST USERS ({len(test_users)}):'))
        if test_users.exists():
            for user in test_users.order_by('username'):
                self.stdout.write(f'   • {user.username}')
        else:
            self.stdout.write('   (None)')

        self.stdout.write(self.style.SUCCESS(f'\n✅ REAL USERS ({len(real_users)}):'))
        for user in real_users.order_by('username'):
            self.stdout.write(f'   • {user.username}')

        self.stdout.write('')
