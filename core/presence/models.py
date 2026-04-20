from django.db import models
from django.conf import settings

class Event(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    latitude = models.FloatField()
    longitude = models.FloatField()
    radius = models.IntegerField(default=100)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class Announcement(models.Model):
    message = models.CharField(max_length=500)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    event = models.ForeignKey('Event', on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

class Attendance(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.student.username} - {self.event.name}"