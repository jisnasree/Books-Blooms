import secrets

from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, VerifyEmailSerializer, ResendEmailCodeSerializer, LoginSerializer,ForgotPasswordSerializer,VerifyResetCodeSerializer
from .models import EmailOTPChallenge, User
import hmac
import hashlib
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token


# Create your views here.
class CreateUserView(APIView):
    def post(self,request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            otp = str(secrets.randbelow(1000000)).zfill(6)

           
            code_hash = hmac.new(
                settings.SECRET_KEY.encode(),
                otp.encode(),
                hashlib.sha256
                ).hexdigest()
            
            expires_at = timezone.now() + timedelta(minutes=10)
            
            EmailOTPChallenge.objects.create(
                user=user,
                purpose='email_verification',
                code_hash = code_hash,
                expires_at=expires_at
            )
            send_mail(
                subject='BookBloom Email Verification',
                message=f'Your BookBloom verification code for verifying the email is {otp}.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )
            return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
        

class VerifyEmailView(APIView):
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']

            user = User.objects.get(email=email)
             
            challenge = EmailOTPChallenge.objects.filter(
                user=user,
                purpose='email_verification'
            ).latest('created_at')
            
            #  Check if OTP has already been used
            if challenge.consumed_at is not None:
              return Response(
              {"message": "OTP has already been used"},
              status=status.HTTP_400_BAD_REQUEST
             )
            
            # Check if OTP has expired
            if timezone.now() > challenge.expires_at:
                return Response(
                {"message": "OTP has expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

            # Create hash from the OTP entered by the user
            code_hash = hmac.new(
                settings.SECRET_KEY.encode(),
                code.encode(),
                hashlib.sha256
            ).hexdigest()

            
            #  Compare the hashes
            if code_hash == challenge.code_hash:
                user.email_verified_at = timezone.now()
                user.save()
                
                challenge.consumed_at = timezone.now()
                challenge.save()
    
                return Response({
                  "message": "Email verified successfully"
                 })

            return Response(
                {
                    "message": "Invalid OTP"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
class ResendEmailCodeView(APIView):
    def post(self,request):
        serializer = ResendEmailCodeSerializer(data=request.data)
        if(serializer.is_valid()):
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            last_challenge = EmailOTPChallenge.objects.filter(
            user=user,
            purpose='email_verification'
            ).order_by('-created_at').first()
            
            if last_challenge is not None:
                time_since_last_code = timezone.now() - last_challenge.created_at

                if time_since_last_code.total_seconds() < 30:
                 return Response(
                 {"message": "Please wait 30 seconds before requesting another code."},
                 status=status.HTTP_429_TOO_MANY_REQUESTS
             )
        
            otp = str(secrets.randbelow(1000000)).zfill(6)

            code_hash = hmac.new(
                settings.SECRET_KEY.encode(),
                otp.encode(),
                hashlib.sha256
            ).hexdigest()

            expires_at = timezone.now() + timedelta(minutes=10)

            EmailOTPChallenge.objects.create(
                user=user,
                purpose='email_verification',
                code_hash=code_hash,
                expires_at=expires_at
            )
            
            send_mail(
            subject='BookBloom Email Verification',
            message=f'Your BookBloom verification code is {otp}.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            )
            return Response({
                "message": "New verification code generated"
            })
                
        return Response(
            serializer.errors,
            status = status.HTTP_400_BAD_REQUEST)
        
class LoginView(APIView):
    def post(self,request):
        serializer = LoginSerializer(data=request.data)
        if(serializer.is_valid()):
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            user = authenticate(
            request = request,
            username = email,
            password = password
             )
            if user is None:
                return Response(
                {"messgae":"invalid email"},
                status = status.HTTP_401_UNAUTHORIZED
               )
            if user.email_verified_at is None:
                return Response({
                "message":"please verify your email"
                },
                status =  status.HTTP_403_FORBIDDEN   
            )
           
            token,created = Token.objects.get_or_create(user=user)
            return Response({
                "message":"Login successful",
                "token" :  token.key
            })
    
        return Response(
            serializer.errors(),
            status = status.HTTP_400_BAD_REQUEST
    )
        
class ForgotPasswordView(APIView):
    def post(self,request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            
            otp = str(secrets.randbelow(1000000)).zfill(6)
            
            code_hash = hmac.new(
                            settings.SECRET_KEY.encode(),
                            otp.encode(),
                            hashlib.sha256
                            ).hexdigest()
            
            expires_at = timezone.now() + timedelta(minutes=10)
            EmailOTPChallenge.objects.create(
                user = user,
                purpose = "Password-reset",
                code_hash = code_hash,
                expires_at = expires_at               
            )
            
            send_mail(
                subject = 'BookBloom Email Verification',
                message = f'Your BookBloom verification code for resetting the password is {otp}.',
                from_email = settings.DEFAULT_FROM_EMAIL,
                recipient_list = [user.email]
            )
            return Response({
                "message": "If an account exists with this email, password reset instructions will be sent"},
                status = status.HTTP_200_OK
            )
            
        
        return Response(
            serializer.errors,
            status = status.HTTP_400_BAD_REQUEST
        )    
            
            

class VerifyResetCode(APIView):
    def post(self,request):
        serializer = VerifyResetCodeSerializer(data=request.data)
        if(serializer.is_valid()):
        
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            user = User.objects.get(email=email)
            
            challenge = EmailOTPChallenge.objects.filter(
                user = user,
                purpose = "Password-reset"
            ).order_by('-created_at').first()
            
    
            #  Check if OTP has already been used
            if challenge.consumed_at is not None:
                return Response(
                {"message": "OTP has already been used"},
                status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if OTP has expired
            if timezone.now() > challenge.expires_at:
                return Response(
                {"message": "OTP has expired"},
                status=status.HTTP_400_BAD_REQUEST
            )
                            
            code_hash = hmac.new(
                settings.SECRET_KEY.encode(),
                code.encode(),
                hashlib.sha256
            ).hexdigest()
            
            if(code_hash == challenge.code_hash):
                user.email_verified_at = timezone.now()
                user.save()
                    
                challenge.consumed_at = timezone.now()
                challenge.save()
                return Response({
                   "message" : "Reset code verified successfully"
                },
                 status = status.HTTP_200_OK
                )
            
            return Response({
                "message" :" Invalid code"
                },
                status = status.HTTP_400_BAD_REQUEST
            )  
        
        return Response(
            serializer.errors,
            status = status.HTTP_400_BAD_REQUEST
        )  
        
# class PasswordResetCodeView(APIView):
#     def post(self,request):
  