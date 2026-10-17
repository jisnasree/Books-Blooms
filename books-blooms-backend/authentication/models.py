from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    profile_image = models.ImageField(
        upload_to="profile_images/",
        blank=True,
        null=True
    )
    
    
class EmailOTPChallenge(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_otp_challenges'
    )
    purpose = models.CharField(max_length=20)
    code_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.SmallIntegerField(default=0)
    send_count = models.SmallIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)