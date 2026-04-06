"""
Command to check and display fake/test data in matchmaking system
Usage:
    python manage.py check_fake_data
    python manage.py check_fake_data --detailed  # Show detailed info
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from apps.matchmaking.models import OpponentRequest, MatchmakingMatch


class Command(BaseCommand):
    help = 'Check and display fake/test data in matchmaking system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Show detailed information about fake data',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n🔍 Checking for fake/test data in matchmaking system...\n'))

        # Fake user patterns
        fake_patterns = ['test_', 'test_team_', 'fake_', 'demo_']

        # Find fake users
        fake_users = User.objects.filter(username__startswith='test_team_')
        
        self.stdout.write(self.style.SUCCESS(f'📊 FAKE TEST USERS:'))
        self.stdout.write(f'   Found {len(fake_users)} test_team_* users')
        
        for user in fake_users:
            self.stdout.write(f'   • {user.username} ({user.email})')

        # Check for opponent requests from fake users
        fake_requests = OpponentRequest.objects.filter(user__in=fake_users)
        self.stdout.write(self.style.SUCCESS(f'\n📋 OPPONENT REQUESTS FROM FAKE USERS:'))
        self.stdout.write(f'   Found {len(fake_requests)} requests')
        if options['detailed']:
            for req in fake_requests:
                self.stdout.write(
                    f'   • {req.user.username}: {req.get_status_display()} '
                    f'(created: {req.created_at.strftime("%Y-%m-%d %H:%M")})'
                )

        # Check for matches involving fake users
        fake_matches = MatchmakingMatch.objects.filter(
            requester__in=fake_users
        ) | MatchmakingMatch.objects.filter(opponent__in=fake_users)
        
        self.stdout.write(self.style.SUCCESS(f'\n🎮 MATCHES WITH FAKE USERS:'))
        self.stdout.write(f'   Found {len(fake_matches)} matches')
        if options['detailed']:
            for match in fake_matches:
                self.stdout.write(
                    f'   • {match.requester.username} vs {match.opponent.username}: '
                    f'{match.get_status_display()} ({match.scheduled_date})'
                )

        # Summary
        self.stdout.write(self.style.SUCCESS('\n📈 SUMMARY:'))
        self.stdout.write(f'   Fake users: {len(fake_users)}')
        self.stdout.write(f'   Fake requests: {len(fake_requests)}')
        self.stdout.write(f'   Fake matches: {len(fake_matches)}')
        
        if len(fake_users) + len(fake_requests) + len(fake_matches) > 0:
            self.stdout.write(self.style.WARNING(
                '\n💡 To delete all fake data, run: python manage.py delete_fake_data\n'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('\n✅ No fake data found!\n'))
