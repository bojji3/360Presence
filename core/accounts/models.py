from django.contrib.auth.models import AbstractUser 
from django.db import models 
 
class User(AbstractUser): 
    USER_TYPES = ( 
        ('student', 'Student'), 
        ('admin', 'Event Admin'), 
    ) 
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='student')
    phone = models.CharField(max_length=15, blank=True)
    last_latitude = models.FloatField(null=True, blank=True)
    last_longitude = models.FloatField(null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
 
    def __str__(self): 
        return self.username 
