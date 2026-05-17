from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from accounts.models import User
from .models import Event, Attendance, Announcement
import json
from datetime import datetime

@csrf_exempt
def student_register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')
        phone = data.get('phone', '')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username exists'}, status=400)
        
        user = User.objects.create_user(
            username=username, 
            password=password, 
            email=email,
            user_type='student'
        )
        user.phone = phone
        user.first_name = first_name
        user.last_name = last_name
        user.save()
        
        return JsonResponse({'success': True, 'user_id': user.id, 'username': user.username})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def student_login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')  # 'admin' or 'student' — enforces which login page can be used

        user = authenticate(request, username=username, password=password)
        if user:
            if role == 'admin' and not user.is_staff:
                return JsonResponse({'error': 'Not an admin account. Use the student login.'}, status=403)
            if role == 'student' and user.is_staff:
                return JsonResponse({'error': 'Admin accounts must use the admin login.'}, status=403)
            login(request, user)
            full_name = user.get_full_name() or user.username
            return JsonResponse({
                'success': True,
                'token': f'token_{user.id}_{user.username}',
                'user_id': user.id,
                'username': user.username,
                'full_name': full_name,
                'email': user.email or '',
                'user_type': user.user_type,
                'is_staff': user.is_staff,
                'redirect': '/admin-dashboard/' if user.is_staff else '/student-dashboard/',
            })
        return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def student_logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'success': True, 'message': 'Logged out'})
    return JsonResponse({'error': 'POST required'}, status=405)

@login_required
def get_active_events(request):
    from django.utils import timezone
    now = timezone.now()
    events = Event.objects.filter(is_active=True).order_by('start_time')
    events_data = []
    for e in events:
        if now < e.start_time:
            status = 'upcoming'
        elif e.start_time <= now <= e.end_time:
            status = 'active'
        else:
            status = 'past'
        events_data.append({
            'id': e.id,
            'name': e.name,
            'description': e.description,
            'location': e.description or e.name,
            'latitude': e.latitude,
            'longitude': e.longitude,
            'radius': e.radius,
            'start_time': e.start_time.isoformat(),
            'end_time': e.end_time.isoformat(),
            'status': status,
            'is_active': e.is_active,
        })
    return JsonResponse({'events': events_data})

@login_required
def my_attendance(request):
    attendances = Attendance.objects.filter(student=request.user).select_related('event')
    data = []
    for a in attendances:
        duration = None
        if a.check_in and a.check_out:
            duration = (a.check_out - a.check_in).total_seconds() / 60
        data.append({
            'event': a.event.name,
            'check_in': a.check_in.isoformat() if a.check_in else None,
            'check_out': a.check_out.isoformat() if a.check_out else None,
            'duration_minutes': round(duration, 2) if duration else None
        })
    return JsonResponse({'attendance': data})

@csrf_exempt
@login_required
def track_attendance(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        from django.utils import timezone
        from math import radians, sin, cos, sqrt, atan2

        data = json.loads(request.body)
        lat = data.get('latitude')
        lng = data.get('longitude')
        event_id = data.get('event_id')

        if lat is None or lng is None:
            return JsonResponse({'error': 'Location required'}, status=400)

        event = Event.objects.get(id=event_id)
        now = timezone.now()

        # Persist last-known location for live monitoring
        request.user.last_latitude = lat
        request.user.last_longitude = lng
        request.user.last_location_update = now
        request.user.save(update_fields=['last_latitude', 'last_longitude', 'last_location_update'])

        R = 6371000
        p1, p2 = radians(lat), radians(event.latitude)
        dphi = radians(event.latitude - lat)
        dlmb = radians(event.longitude - lng)
        a = sin(dphi/2)**2 + cos(p1)*cos(p2)*sin(dlmb/2)**2
        distance = R * 2 * atan2(sqrt(a), sqrt(1-a))
        is_inside = distance <= event.radius

        # Find the latest open session (checked in, not yet checked out)
        open_attendance = Attendance.objects.filter(
            student=request.user, event=event, check_out__isnull=True
        ).order_by('-check_in').first()

        response = {
            'is_inside': is_inside,
            'distance_meters': round(distance, 2),
            'event': event.name,
        }

        if is_inside and open_attendance is None:
            # First entry, or re-entry after a prior checkout
            Attendance.objects.create(student=request.user, event=event, check_in=now)
            response['checked_in'] = True
            response['message'] = f'Checked in to {event.name}!'
        elif not is_inside and open_attendance is not None:
            open_attendance.check_out = now
            open_attendance.save(update_fields=['check_out'])
            duration = (open_attendance.check_out - open_attendance.check_in).total_seconds() / 60
            response['checked_out'] = True
            response['duration_minutes'] = round(duration, 2)
            response['message'] = f'Checked out. Duration: {round(duration, 2)} minutes'

        return JsonResponse(response)
    except Event.DoesNotExist:
        return JsonResponse({'error': 'Event not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
def latest_announcements(request):
    from django.utils import timezone
    from datetime import timedelta
    cutoff = timezone.now() - timedelta(minutes=30)
    items = Announcement.objects.filter(created_at__gte=cutoff)[:10]
    return JsonResponse({'announcements': [
        {'id': a.id, 'message': a.message, 'created_at': a.created_at.isoformat()}
        for a in items
    ]})

@login_required
def present_students(request, event_id):
    from django.utils import timezone
    from datetime import timedelta
    from math import radians, sin, cos, sqrt, atan2

    def haversine_m(lat1, lon1, lat2, lon2):
        R = 6371000
        p1, p2 = radians(lat1), radians(lat2)
        dphi = radians(lat2 - lat1)
        dlmb = radians(lon2 - lon1)
        a = sin(dphi/2)**2 + cos(p1)*cos(p2)*sin(dlmb/2)**2
        return R * 2 * atan2(sqrt(a), sqrt(1-a))

    try:
        event = Event.objects.get(id=event_id)
        now = timezone.now()
        recent_cutoff = now - timedelta(minutes=60)

        # Pool 1: Students with open attendance sessions
        checked_in_ids = set(Attendance.objects.filter(
            event=event,
            check_in__isnull=False,
            check_out__isnull=True,
            student__is_staff=False
        ).values_list('student_id', flat=True))

        # Pool 2: Students with recent location updates inside event radius
        nearby_ids = set()
        students_with_location = User.objects.filter(
            user_type='student',
            is_staff=False,
            last_latitude__isnull=False,
            last_longitude__isnull=False,
            last_location_update__gte=recent_cutoff
        )
        for s in students_with_location:
            dist = haversine_m(s.last_latitude, s.last_longitude, event.latitude, event.longitude)
            if dist <= event.radius:
                nearby_ids.add(s.id)

        # Combine both pools
        all_student_ids = checked_in_ids | nearby_ids
        students = User.objects.filter(id__in=all_student_ids, is_staff=False)

        # Build attendance lookup
        attendance_map = {}
        for a in Attendance.objects.filter(event=event, check_out__isnull=True, student_id__in=all_student_ids):
            attendance_map[a.student_id] = a

        result = []
        for s in students:
            att = attendance_map.get(s.id)
            result.append({
                'id': s.id,
                'name': s.get_full_name() or s.username,
                'username': s.username,
                'check_in_time': att.check_in.isoformat() if att and att.check_in else None,
                'latitude': s.last_latitude,
                'longitude': s.last_longitude,
                'last_seen': s.last_location_update.isoformat() if s.last_location_update else None,
            })

        return JsonResponse({
            'event': event.name,
            'count': len(result),
            'students': result
        })
    except Event.DoesNotExist:
        return JsonResponse({'error': 'Event not found'}, status=404)