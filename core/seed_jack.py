import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from presence.models import Event, Attendance
from accounts.models import User
from django.utils import timezone

jack = User.objects.get(username='jackryan')
ev = Event.objects.get(name='Intramurals Day 2')
now = timezone.now()

jack.last_latitude = 13.6310
jack.last_longitude = 123.1850
jack.last_location_update = now
jack.save()

att, created = Attendance.objects.get_or_create(
    student=jack, event=ev, check_out__isnull=True,
    defaults={'check_in': now}
)
status = 'created' if created else 'exists'
print(f'Jack Ryan: lat={jack.last_latitude}, lng={jack.last_longitude}, attendance={status}')

total = Attendance.objects.filter(event=ev, check_out__isnull=True).count()
print(f'Total open sessions for Intramurals Day 2: {total}')

all_students = User.objects.filter(
    last_latitude__isnull=False,
    last_location_update__gte=now - timezone.timedelta(minutes=60)
)
print(f'Students with recent location: {all_students.count()}')
for s in all_students:
    print(f'  {s.get_full_name()} - lat={s.last_latitude}, lng={s.last_longitude}')
