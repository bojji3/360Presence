from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

def home(request):
    return JsonResponse({'message': '360Presence API'})

@csrf_exempt
def test_location(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse({'success': True, 'received': data})
    return JsonResponse({'error': 'POST required'}, status=405)

@csrf_exempt
def check_location(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse({'status': 'success', 'data': data})
    return JsonResponse({'error': 'POST required'}, status=405)