import re
from .models import User
from django.utils import timezone
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'password','first_name','last_name','terms_accepted_at',
            'email_verified_at','profile_image',]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
        }
    
    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )
        if not re.search(r"[A-Za-z]", value):
            raise serializers.ValidationError(
            "Password must contain at least one letter."
        )

        if not re.search(r"\d", value):
            raise serializers.ValidationError(
            "Password must contain at least one digit."
        )

        if not re.search(r"[^A-Za-z0-9\s]", value):
            raise serializers.ValidationError(
            "Password must contain at least one special character."
        )

        return value
        
    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(username=validated_data['email'],terms_accepted_at=timezone.now(), **validated_data)
        user.set_password(password)
        user.save()
        return user

class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    
    
class ResendEmailCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
class VerifyResetCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    
class SetNewPasswordSerislizer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    
class SetNewPasswordSerializer(serializers.Serializer):
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True,min_length=8)
    # confirm_password = serializers.CharField(write_only=True)

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "date_joined",
            "is_active",
            "is_blocked"
        ]




