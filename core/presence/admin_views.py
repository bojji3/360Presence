from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from .models import Event, Attendance, Announcement
from accounts.models import User
import json
from datetime import datetime

@csrf_exempt
@staff_member_required(login_url='/admin-login/')
def admin_events(request, event_id=None):
    if request.method == 'GET':
        if event_id:
            event = Event.objects.get(id=event_id)
            return JsonResponse({
                'id': event.id,
                'name': event.name,
                'description': event.description,
                'latitude': event.latitude,
                'longitude': event.longitude,
                'radius': event.radius,
                'start_time': event.start_time.isoformat(),
                'end_time': event.end_time.isoformat(),
                'is_active': event.is_active
            })
        else:
            events = Event.objects.filter(created_by=request.user)
            return JsonResponse([{
                'id': e.id,
                'name': e.name,
                'latitude': e.latitude,
                'longitude': e.longitude,
                'radius': e.radius,
                'start_time': e.start_time.isoformat(),
                'end_time': e.end_time.isoformat(),
                'is_active': e.is_active
            } for e in events], safe=False)
    
    elif request.method == 'POST':
        data = json.loads(request.body)
        event = Event.objects.create(
            name=data['name'],
            description=data.get('description', ''),
            latitude=data['latitude'],
            longitude=data['longitude'],
            radius=data['radius'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            created_by=request.user,
            is_active=True
        )
        return JsonResponse({'id': event.id, 'message': 'Event created'})
    
    elif request.method == 'PUT':
        data = json.loads(request.body)
        event = Event.objects.get(id=event_id)
        event.name = data.get('name', event.name)
        event.description = data.get('description', event.description)
        event.latitude = data.get('latitude', event.latitude)
        event.longitude = data.get('longitude', event.longitude)
        event.radius = data.get('radius', event.radius)
        event.start_time = data.get('start_time', event.start_time)
        event.end_time = data.get('end_time', event.end_time)
        event.is_active = data.get('is_active', event.is_active)
        event.save()
        return JsonResponse({'message': 'Event updated'})
    
    elif request.method == 'DELETE':
        Event.objects.get(id=event_id).delete()
        return JsonResponse({'message': 'Event deleted'})

@staff_member_required(login_url='/admin-login/')
def live_students(request):
    from math import radians, sin, cos, sqrt, atan2
    from django.utils import timezone
    from datetime import timedelta

    def haversine_m(lat1, lon1, lat2, lon2):
        R = 6371000
        p1, p2 = radians(lat1), radians(lat2)
        dphi = radians(lat2 - lat1)
        dlmb = radians(lon2 - lon1)
        a = sin(dphi/2)**2 + cos(p1)*cos(p2)*sin(dlmb/2)**2
        return R * 2 * atan2(sqrt(a), sqrt(1-a))

    now = timezone.now()
    active_events = list(Event.objects.filter(is_active=True, start_time__lte=now, end_time__gte=now))
    recent_cutoff = now - timedelta(minutes=5)

    students = User.objects.filter(
        user_type='student',
        last_latitude__isnull=False,
        last_longitude__isnull=False,
        last_location_update__gte=recent_cutoff,
    )

    student_data = []
    for s in students:
        is_inside = False
        for ev in active_events:
            if haversine_m(s.last_latitude, s.last_longitude, ev.latitude, ev.longitude) <= ev.radius:
                is_inside = True
                break
        student_data.append({
            'id': s.id,
            'name': s.get_full_name() or s.username,
            'latitude': s.last_latitude,
            'longitude': s.last_longitude,
            'is_inside': is_inside,
            'last_seen': s.last_location_update.isoformat(),
        })

    return JsonResponse({'students': student_data})

@staff_member_required(login_url='/admin-login/')
def attendance_records(request):
    records = Attendance.objects.select_related('student', 'event').all().order_by('-event__start_time', '-check_in')
    data = []
    for r in records:
        duration = None
        if r.check_in and r.check_out:
            duration = round((r.check_out - r.check_in).total_seconds() / 60, 2)
        data.append({
            'student_name': r.student.username,
            'event_name': r.event.name,
            'event_start': r.event.start_time.strftime('%Y-%m-%d %H:%M:%S') if r.event.start_time else '',
            'check_in': r.check_in.strftime('%Y-%m-%d %H:%M:%S') if r.check_in else None,
            'check_out': r.check_out.strftime('%Y-%m-%d %H:%M:%S') if r.check_out else None,
            'duration': f'{duration} mins' if duration else '-'
        })
    return JsonResponse(data, safe=False)

@staff_member_required(login_url='/admin-login/')
def export_attendance(request):
    import csv
    from django.http import HttpResponse
    
    event_name = request.GET.get('event', '')
    records = Attendance.objects.select_related('student', 'event')
    if event_name:
        records = records.filter(event__name=event_name)
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="attendance_{datetime.now().strftime("%Y%m%d")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Student Name', 'Event Name', 'Check In Time', 'Check Out Time', 'Duration (minutes)'])
    
    for r in records:
        duration = None
        if r.check_in and r.check_out:
            duration = round((r.check_out - r.check_in).total_seconds() / 60, 2)
        writer.writerow([
            r.student.username,
            r.event.name,
            r.check_in.strftime('%Y-%m-%d %H:%M:%S') if r.check_in else '',
            r.check_out.strftime('%Y-%m-%d %H:%M:%S') if r.check_out else '',
            duration or ''
        ])
    
    return response

@staff_member_required(login_url='/admin-login/')
def admin_dashboard(request):
    from django.shortcuts import render
    return render(request, 'admin_dashboard.html')

@csrf_exempt
@staff_member_required(login_url='/admin-login/')
def broadcast_announcement(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    data = json.loads(request.body)
    msg = (data.get('message') or '').strip()
    if not msg:
        return JsonResponse({'error': 'message required'}, status=400)
    a = Announcement.objects.create(message=msg, created_by=request.user)
    return JsonResponse({'id': a.id, 'message': a.message, 'created_at': a.created_at.isoformat()})

@staff_member_required(login_url='/admin-login/')
def admin_students(request):
    students = User.objects.filter(user_type='student')
    data = []
    for s in students:
        attendance_count = Attendance.objects.filter(student=s).count()
        present_count = Attendance.objects.filter(student=s, check_in__isnull=False).count()
        attendance_rate = round((present_count / attendance_count * 100), 1) if attendance_count > 0 else 0
        
        data.append({
            'id': s.id,
            'name': s.get_full_name() or s.username,
            'email': s.email,
            'attendance': attendance_rate,
            'last_seen': s.last_login.strftime('%Y-%m-%d %H:%M:%S') if s.last_login else 'Never',
            'status': 'present' if s.is_active else 'away'
        })
    return JsonResponse({'students': data})
