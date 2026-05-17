from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.contrib.admin.views.decorators import staff_member_required
from presence import api_views, student_views, admin_views, page_views

@staff_member_required(login_url='/admin-login/')
def admin_dashboard(request):
    from django.shortcuts import render
    from django.views.decorators.cache import never_cache
    response = render(request, 'admin_dashboard.html')
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

def home(request):
    if request.user.is_authenticated:
        if request.user.is_staff:
            return redirect('/admin-dashboard/')
        return redirect('/student-dashboard/')
    return redirect('/student-login/')

urlpatterns = [
    # Django system admin
    path('admin/', admin.site.urls),

    # Admin dashboard + login
    path('admin-dashboard/', admin_dashboard, name='admin_dashboard'),
    path('admin-login/', page_views.admin_login_page, name='admin_login'),

    # Student dashboard + login/register
    path('student-dashboard/', page_views.dashboard, name='student_dashboard'),
    path('student-login/', page_views.login_page, name='student_login'),
    path('student-register/', page_views.register_page, name='student_register'),
    path('logout/', page_views.logout_view, name='logout'),

    # Back-compat redirects for old paths
    path('dashboard/', lambda r: redirect('/student-dashboard/')),
    path('login/', lambda r: redirect('/student-login/')),
    path('register/', lambda r: redirect('/student-register/')),
    
    # APIs
    path('api/register/', student_views.student_register),
    path('api/login/', student_views.student_login),
    path('api/logout/', student_views.student_logout),
    path('api/user/', page_views.get_user),
    path('api/events/', student_views.get_active_events),
    path('api/track/', student_views.track_attendance),
    path('api/my-attendance/', student_views.my_attendance),
    path('api/present-students/<int:event_id>/', student_views.present_students),
    path('api/announcements/', student_views.latest_announcements),
    
    path('api/admin/events/', admin_views.admin_events),
    path('api/admin/events/<int:event_id>/', admin_views.admin_events),
    path('api/admin/live-students/', admin_views.live_students),
    path('api/admin/attendance/', admin_views.attendance_records),
    path('api/admin/export/', admin_views.export_attendance),
    path('api/admin/students/', admin_views.admin_students),
    path('api/admin/announce/', admin_views.broadcast_announcement),
    
    # Home
    path('', home, name='home'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
