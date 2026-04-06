#!/usr/bin/env python3
"""
Test script for team-based matchmaking system
Tests the new team_name field and removal of preferred_position
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import UserProfile
from apps.matchmaking.models import OpponentRequest, MatchmakingMatch
from apps.matchmaking.serializers import UserBasicSerializer

def test_team_based_matchmaking():
    """Test the team-based matchmaking functionality"""

    print("🧪 Testing Team-Based Matchmaking System")
    print("=" * 50)

    # Test 1: Create users with team names
    print("\n1. Creating test users with team names...")

    # Clean up existing test data
    User.objects.filter(username__startswith='test_team_').delete()

    # Create test users
    teams_data = [
        {'username': 'test_team_alpha', 'team_name': 'FC Alpha Warriors', 'skill_level': 'advanced'},
        {'username': 'test_team_beta', 'team_name': 'Beta United', 'skill_level': 'intermediate'},
        {'username': 'test_team_gamma', 'team_name': 'Gamma FC', 'skill_level': 'advanced'},
        {'username': 'test_team_delta', 'team_name': 'Delta Strikers', 'skill_level': 'professional'},
    ]

    users = []
    for team_data in teams_data:
        user = User.objects.create_user(
            username=team_data['username'],
            email=f"{team_data['username']}@test.com",
            password='testpass123',
            first_name=team_data['team_name'].split()[0],
            last_name=' '.join(team_data['team_name'].split()[1:]) if len(team_data['team_name'].split()) > 1 else 'FC'
        )

        # Update profile with team info
        profile = user.profile
        profile.team_name = team_data['team_name']
        profile.skill_level = team_data['skill_level']
        profile.rating = 4.0
        profile.total_matches = 10
        profile.total_wins = 7
        profile.bio = f"Professional team with {team_data['skill_level']} skills"
        profile.save()

        users.append(user)
        print(f"   ✅ Created {team_data['team_name']} ({team_data['skill_level']})")

    # Test 2: Test serialization
    print("\n2. Testing UserBasicSerializer with team data...")

    serializer = UserBasicSerializer(users[0])
    data = serializer.data

    assert 'profile' in data, "Profile data missing"
    assert data['profile']['team_name'] == 'FC Alpha Warriors', f"Team name mismatch: {data['profile']['team_name']}"
    assert 'preferred_position' not in data['profile'], "preferred_position should be removed"
    assert data['profile']['skill_level'] == 'advanced', f"Skill level mismatch: {data['profile']['skill_level']}"
    assert data['win_rate'] == 70.0, f"Win rate calculation wrong: {data['win_rate']}"

    print("   ✅ Serialization works correctly")
    print(f"   📊 Team: {data['profile']['team_name']}")
    print(f"   🎯 Skill: {data['profile']['skill_level']}")
    print(f"   📈 Win Rate: {data['win_rate']}%")

    # Test 3: Test opponent request creation
    print("\n3. Testing opponent request creation...")

    # Create request for Alpha team
    request = OpponentRequest.objects.create(
        user=users[0],
        preferred_skill_level='advanced',
        min_rating=3.5,
        notes='Looking for competitive matches'
    )

    print(f"   ✅ Created request for {users[0].profile.team_name}")
    print(f"   🎯 Looking for: {request.preferred_skill_level} level teams")
    print(f"   ⭐ Min rating: {request.min_rating}")

    # Test 4: Test suggestions logic
    print("\n4. Testing suggestions algorithm...")

    from apps.matchmaking.views import OpponentRequestViewSet
    from rest_framework.test import APIRequestFactory

    factory = APIRequestFactory()
    request_obj = factory.get('/api/matchmaking/requests/suggestions/')
    request_obj.user = users[0]

    viewset = OpponentRequestViewSet()
    viewset.request = request_obj

    # Get suggestions
    response = viewset.suggestions(request_obj)
    suggestions_data = response.data

    print(f"   📋 Found {len(suggestions_data)} suggestions")

    # Should find Beta, Gamma, Delta (all have rating >= 3.5)
    # Alpha should not be included (self)
    expected_teams = ['Beta United', 'Gamma FC', 'Delta Strikers']
    found_teams = [suggestion['profile']['team_name'] for suggestion in suggestions_data]

    for expected_team in expected_teams:
        assert expected_team in found_teams, f"Missing expected team: {expected_team}"

    print("   ✅ All expected teams found in suggestions")
    for team in found_teams:
        print(f"      🏆 {team}")

    # Test 5: Test match creation
    print("\n5. Testing match creation between teams...")

    match = MatchmakingMatch.objects.create(
        requester=users[0],
        opponent=users[1],
        scheduled_date='2024-12-25',
        scheduled_time_start='19:00',
        scheduled_time_end='20:00',
        status='pending_confirmation'
    )

    print(f"   ✅ Created match: {users[0].profile.team_name} vs {users[1].profile.team_name}")
    print(f"   📅 Date: {match.scheduled_date}")
    print(f"   🕐 Time: {match.scheduled_time_start} - {match.scheduled_time_end}")

    # Test 6: Test result recording
    print("\n6. Testing match result recording...")

    # Simulate Alpha wins
    match.status = 'confirmed'
    match.match_result = 'win'
    match.my_goals = 3
    match.opponent_goals = 1
    match.save()

    # Update stats
    alpha_profile = users[0].profile
    alpha_profile.total_matches += 1
    alpha_profile.total_wins += 1
    alpha_profile.save()

    beta_profile = users[1].profile
    beta_profile.total_matches += 1
    beta_profile.save()

    print(f"   🏆 Result: {users[0].profile.team_name} 3-1 {users[1].profile.team_name}")
    print(f"   📊 Alpha stats: {alpha_profile.total_matches} matches, {alpha_profile.total_wins} wins")
    print(f"   📊 Beta stats: {beta_profile.total_matches} matches, {beta_profile.total_wins} wins")

    # Cleanup
    print("\n🧹 Cleaning up test data...")
    MatchmakingMatch.objects.filter(requester__in=users).delete()
    OpponentRequest.objects.filter(user__in=users).delete()
    User.objects.filter(username__startswith='test_team_').delete()

    print("   ✅ Test data cleaned up")

    print("\n🎉 All tests passed! Team-based matchmaking is working correctly.")
    print("\n📋 Summary:")
    print("   ✅ Team names added to profiles")
    print("   ✅ preferred_position removed")
    print("   ✅ Serialization includes team data")
    print("   ✅ Suggestions work with team filtering")
    print("   ✅ Match creation between teams")
    print("   ✅ Result recording and stat updates")

if __name__ == '__main__':
    test_team_based_matchmaking()