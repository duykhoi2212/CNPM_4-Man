#!/usr/bin/env python
"""
Script to show all users and their related matchmaking data
"""
import os
import sys
import django

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    
    from django.contrib.auth.models import User
    from apps.matchmaking.models import OpponentRequest, MatchmakingMatch
    
    print("\n" + "="*80)
    print("ALL USERS IN SYSTEM:")
    print("="*80)
    
    for user in User.objects.all().order_by('-date_joined'):
        profile_info = ""
        if hasattr(user, 'profile'):
            team = user.profile.team_name if user.profile.team_name else "N/A"
            profile_info = f" | Team: {team}"
        
        status = "ADMIN" if user.is_staff else "USER"
        print("ID:%2d | %-20s | %-30s | %-5s%s" % (user.id, user.username, user.email, status, profile_info))
    
    print("="*80)
    
    print("\n" + "="*80)
    print("OPPONENT REQUESTS:")
    print("="*80)
    
    for req in OpponentRequest.objects.all().order_by('-created_at'):
        print("User: %-20s | Status: %-15s | Skill: %-15s | Created: %s" % (
            req.user.username, req.status, req.preferred_skill_level, 
            req.created_at.strftime('%Y-%m-%d %H:%M')
        ))
    
    print("="*80)
    
    print("\n" + "="*80)
    print("MATCHMAKING MATCHES:")
    print("="*80)
    
    for match in MatchmakingMatch.objects.all().order_by('-created_at'):
        result = match.match_result if match.match_result else "N/A"
        print("%s vs %s | %s | Status: %-20s | Result: %s" % (
            match.requester.username, match.opponent.username, 
            match.scheduled_date, match.status, result
        ))
    
    print("="*80 + "\n")
