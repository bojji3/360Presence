from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout
from django.http import JsonResponse
from django.http import HttpResponseRedirect

def login_page(request):
    return render(request, 'login.html')

def admin_login_page(request):
    return render(request, 'admin_login.html')

def register_page(request):
    return render(request, 'register.html')

@login_required
def dashboard(request):
    import os
    from django.conf import settings
    from django.http import HttpResponse
    index_path = os.path.join(settings.BASE_DIR, 'static', 'react', 'index.html')
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read())
    except FileNotFoundError:
        return HttpResponse('React build not found. Run `npm run build` in frontend/.', status=500)

@login_required
def get_user(request):
    return JsonResponse({
        'username': request.user.username,
        'email': request.user.email,
        'user_type': request.user.user_type
    })

def logout_view(request):
    auth_logout(request)
    return HttpResponseRedirect('/student-login/')
