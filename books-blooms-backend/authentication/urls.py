from django.urls import path

from . import views

urlpatterns = [
    path('register/', views.CreateUserView.as_view()),
    path('register/verify-email/', views.VerifyEmailView.as_view()),
    path('register/resend-code/', views.ResendEmailCodeView.as_view()),
    path('login/', views.LoginView.as_view()),
    path('forgot/', views.ForgotPasswordView.as_view()),
    path('forgot/verify-reset-code/', views.VerifyResetCode.as_view()),
    # path('forgot/password-reset/', views.PasswordResetCodeView.as_view()),
    ]
