import re
from .models import User
from django.utils import timezone
from rest_framework import serializers


def validate_name_rules(value, field_name):

    value = value.strip()

    if not value:
        raise serializers.ValidationError(f"{field_name} is required.")

    name_pattern = r"[^\W\d_]+(?:[ '-’][^\W\d_]+)*"

    if not re.fullmatch(name_pattern, value):
        raise serializers.ValidationError(
            f"{field_name} can contain only letters, spaces, hyphens, and apostrophes."
        )

    return value


def validate_password_rules(value):

    if len(value) < 8:
        raise serializers.ValidationError(
            "Password must be at least 8 characters long."
        )

    if not re.search(r"[A-Za-z]", value):
        raise serializers.ValidationError("Password must contain at least one letter.")

    if not re.search(r"\d", value):
        raise serializers.ValidationError("Password must contain at least one digit.")

    if not re.search(r"[^A-Za-z0-9\s]", value):
        raise serializers.ValidationError(
            "Password must contain at least one special character."
        )

    return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "terms_accepted_at",
            "email_verified_at",
            "profile_image",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True},
            "first_name": {"required": True, "allow_blank": False},
            "last_name": {"required": True, "allow_blank": False},
        }
        
    def validate_first_name(self, value):
        return validate_name_rules(value, "First name")


    def validate_last_name(self, value):
        return validate_name_rules(value, "Last name")

    def validate_password(self, value):
        return validate_password_rules(value)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(
            username=validated_data["email"],
            terms_accepted_at=timezone.now(),
            **validated_data,
        )
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


class SetNewPasswordSerializer(serializers.Serializer):
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        return validate_password_rules(value)


class UserProfileSerializer(serializers.ModelSerializer):
    isAdmin = serializers.BooleanField(source="is_staff", read_only=True)
    isAuthenticated = serializers.SerializerMethodField()

    def get_isAuthenticated(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated)
    
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "isAdmin",
            "isAuthenticated",
            "profile_image",
        ]
        read_only_fields = ["id", "email"]
