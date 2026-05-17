import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from presence.models import Event, Attendance
from accounts.models import User
from django.utils import timezone

ev = Event.objects.get(name='Intramurals Day 2')
print(f'Event: {ev.name}, lat={ev.latitude}, lng={ev.longitude}, radius={ev.radius}m')

students = [
    {'username': 'maria_santos', 'first': 'Maria', 'last': 'Santos', 'lat': 13.6315, 'lng': 123.1855},
    {'username': 'jose_reyes', 'first': 'Jose', 'last': 'Reyes', 'lat': 13.6305, 'lng': 123.1840},
    {'username': 'ana_cruz', 'first': 'Ana', 'last': 'Cruz', 'lat': 13.6320, 'lng': 123.1860},
    {'username': 'pedro_garcia', 'first': 'Pedro', 'last': 'Garcia', 'lat': 13.6298, 'lng': 123.1835},
    {'username': 'lisa_tan', 'first': 'Lisa', 'last': 'Tan', 'lat': 13.6325, 'lng': 123.1870},
    {'username': 'mark_lopez', 'first': 'Mark', 'last': 'Lopez', 'lat': 13.6308, 'lng': 123.1850},
    {'username': 'sarah_kim', 'first': 'Sarah', 'last': 'Kim', 'lat': 13.6312, 'lng': 123.1842},
    {'username': 'david_chen', 'first': 'David', 'last': 'Chen', 'lat': 13.6318, 'lng': 123.1858},
]

now = timezone.now()
for s in students:
    user, created = User.objects.get_or_create(
        username=s['username'],
        defaults={
            'first_name': s['first'],
            'last_name': s['last'],
            'email': s['username'] + '@360presence.local',
            'user_type': 'student',
            'is_staff': False,
        }
    )
    if created:
        user.set_password('student123')
    user.last_latitude = s['lat']
    user.last_longitude = s['lng']
    user.last_location_update = now
    user.save()
    
    att, att_created = Attendance.objects.get_or_create(
        student=user, event=ev, check_out__isnull=True,
        defaults={'check_in': now}
    )
    status = 'Created' if created else 'Updated'
    att_status = 'New attendance' if att_created else 'Already checked in'
    print(f'{status}: {user.get_full_name()} (lat={s["lat"]}, lng={s["lng"]}) - {att_status}')

print(f'\nTotal students in event: {Attendance.objects.filter(event=ev, check_out__isnull=True).count()}')
