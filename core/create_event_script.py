import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from presence.models import Event
from django.contrib.auth.models import User
from django.utils import timezone
import datetime

# Coordinates for Ateneo de Naga University
lat = 13.63078
lng = 123.18432

# Create datetime objects for April 30, 2026 9:00 AM to May 1, 2026 10:00 PM
start_time = timezone.make_aware(datetime.datetime(2026, 4, 30, 9, 0, 0))
end_time = timezone.make_aware(datetime.datetime(2026, 5, 1, 22, 0, 0))

# Get admin user
admin = User.objects.filter(is_staff=True).first()

if not admin:
    print("No admin user found!")
else:
    # Create event
    event = Event.objects.create(
        name='Ateneo de Naga University Event',
        description='Event at Ateneo de Naga University',
        latitude=lat,
        longitude=lng,
        radius=2000,
        start_time=start_time,
        end_time=end_time,
        created_by=admin,
        is_active=True
    )
    print('Event created successfully!')
    print(f'ID: {event.id}')
    print(f'Name: {event.name}')
    print(f'Start: {event.start_time}')
    print(f'End: {event.end_time}')
    status = 'active' if event.start_time <= timezone.now() <= event.end_time else 'upcoming'
    print(f'Status: {status}')
