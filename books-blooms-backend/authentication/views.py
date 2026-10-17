import secrets

from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    UserSerializer,
    VerifyEmailSerializer,
    ResendEmailCodeSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    VerifyResetCodeSerializer,
    SetNewPasswordSerializer,
)
from .models import EmailOTPChallenge, User
import hmac
import hashlib
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError
from rest_framework.authtoken.models import Token
from django.core import signing
from rest_framework.permissions import IsAuthenticated


# Create your views here.
class CreateUserView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            otp = str(secrets.randbelow(1000000)).zfill(6)

            code_hash = hmac.new(
                settings.SECRET_KEY.encode(), otp.encode(), hashlib.sha256
            ).hexdigest()

            expires_at = timezone.now() + timedelta(minutes=10)

            EmailOTPChallenge.objects.create(
                user=user,
                purpose="email_verification",
                code_hash=code_hash,
                expires_at=expires_at,
            )
            send_mail(
                subject="BookBloom Email Verification",
                message=f"Your BookBloom verification code for verifying the email is {otp}.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data["email"]
            code = serializer.validated_data["code"]

            user = User.objects.get(email=email)

            challenge = EmailOTPChallenge.objects.filter(
                user=user, purpose="email_verification"
            ).latest("created_at")

            #  Check if OTP has already been used
            if challenge.consumed_at is not None:
                return Response(
                    {"message": "OTP has already been used"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if OTP has expired
            if timezone.now() > challenge.expires_at:
                return Response(
                    {"message": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Create hash from the OTP entered by the user
            code_hash = hmac.new(
                settings.SECRET_KEY.encode(), code.encode(), hashlib.sha256
            ).hexdigest()

            #  Compare the hashes
            if code_hash == challenge.code_hash:
                user.email_verified_at = timezone.now()
                user.save()

                challenge.consumed_at = timezone.now()
                challenge.save()

                return Response({"message": "Email verified successfully"})

            return Response(
                {"message": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendEmailCodeView(APIView):
    def post(self, request):
        serializer = ResendEmailCodeSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            user = User.objects.get(email=email)

            last_challenge = (
                EmailOTPChallenge.objects.filter(
                    user=user, purpose="email_verification"
                )
                .order_by("-created_at")
                .first()
            )

            if last_challenge is not None:
                time_since_last_code = timezone.now() - last_challenge.created_at

                if time_since_last_code.total_seconds() < 30:
                    return Response(
                        {
                            "message": "Please wait 30 seconds before requesting another code."
                        },
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )

            otp = str(secrets.randbelow(1000000)).zfill(6)

            code_hash = hmac.new(
                settings.SECRET_KEY.encode(), otp.encode(), hashlib.sha256
            ).hexdigest()

            expires_at = timezone.now() + timedelta(minutes=10)

            EmailOTPChallenge.objects.create(
                user=user,
                purpose="email_verification",
                code_hash=code_hash,
                expires_at=expires_at,
            )

            send_mail(
                subject="BookBloom Email Verification",
                message=f"Your BookBloom verification code is {otp}.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )
            return Response({"message": "New verification code generated"})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]

            user = authenticate(request=request, username=email, password=password)
            if user is None:
                return Response(
                    {
                        "message": "invalid email or password",
                        "isLoggedIn": False,
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if user.email_verified_at is None:
                return Response(
                    {"message": "please verify your email"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # at this point user is verified. Generate the token for user
            token, created = Token.objects.get_or_create(user=user)

            return Response(
                {
                    "message": "Login successful",
                    "isAuthenticated": True,
                    "token": token.key,
                    "isAdmin": user.is_staff,
                    "first_name": user.first_name,
                    "profile_image": (
                        request.build_absolute_uri(user.profile_image.url)
                        if user.profile_image
                        else None
                    ),
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()

        return Response(
            {"message": "Logout successful"},
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            user = User.objects.filter(email=email).first()

            otp = str(secrets.randbelow(1000000)).zfill(6)

            code_hash = hmac.new(
                settings.SECRET_KEY.encode(), otp.encode(), hashlib.sha256
            ).hexdigest()

            expires_at = timezone.now() + timedelta(minutes=10)
            EmailOTPChallenge.objects.create(
                user=user,
                purpose="Password-reset",
                code_hash=code_hash,
                expires_at=expires_at,
            )

            send_mail(
                subject="BookBloom Email Verification",
                message=f"Your BookBloom verification code for resetting the password is {otp}.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )
            return Response(
                {
                    "message": "If an account exists with this email, password reset instructions will be sent"
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyResetCode(APIView):
    def post(self, request):
        serializer = VerifyResetCodeSerializer(data=request.data)
        if serializer.is_valid():

            email = serializer.validated_data["email"]
            code = serializer.validated_data["code"]
            user = User.objects.get(email=email)

            challenge = (
                EmailOTPChallenge.objects.filter(user=user, purpose="Password-reset")
                .order_by("-created_at")
                .first()
            )

            #  Check if OTP has already been used
            if challenge.consumed_at is not None:
                return Response(
                    {"message": "OTP has already been used"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if OTP has expired
            if timezone.now() > challenge.expires_at:
                return Response(
                    {"message": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST
                )

            code_hash = hmac.new(
                settings.SECRET_KEY.encode(), code.encode(), hashlib.sha256
            ).hexdigest()

            if code_hash == challenge.code_hash:

                challenge.consumed_at = timezone.now()
                challenge.save()

                reset_token = signing.dumps(
                    {
                        "user_id": str(user.pk),
                        "purpose": "password-reset",
                        "password_hash": user.password,
                    },
                    salt="books-blooms-password-reset",
                )
                return Response(
                    {
                        "message": "Reset code verified successfully",
                        "reset_token": reset_token,
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"message": " Invalid code"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SetNewPasswordView(APIView):
    def post(self, request):
        serializer = SetNewPasswordSerializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.validated_data["reset_token"]
            new_password = serializer.validated_data["new_password"]

            try:
                data = signing.loads(
                    reset_token, salt="books-blooms-password-reset", max_age=600
                )
                user = User.objects.get(id=data["user_id"])

            except (signing.BadSignature, User.DoesNotExist, KeyError):
                return Response(
                    {"message": "Invalid or expired reset token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                data.get("purpose") != "password-reset"
                or data.get("password_hash") != user.password
            ):
                return Response(
                    {"message": "Invalid reset token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                password_validation.validate_password(new_password, user)
            except ValidationError as error:
                return Response(
                    {"new_password": error.messages}, status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.save(update_fields=["password"])

            return Response(
                {"message": "Password reset successful."}, status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
