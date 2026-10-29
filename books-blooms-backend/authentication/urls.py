from django.urls import path

from . import views

urlpatterns = [
    # authentication URLs
    path("register/", views.CreateUserView.as_view()),
    path("register/verify-email/", views.EmailVerificationCodeView.as_view()),
    path(
        "register/resend-resetcode-email/",
        views.ResendEmailVerificationCodeView.as_view(),
    ),
    path("login/", views.LoginView.as_view()),
    path("forgot-password/", views.ForgotPasswordView.as_view()),
    path(
        "forgot-password/verify-reset-code/",
        views.ForgotPassordVerifyResetCode.as_view(),
    ),
    path("forgot-password/set-new-password/", views.SetNewPasswordView.as_view()),
    path(
        "forgot-password/resend-reset-code/",
        views.ResendPasswordResetCodeView.as_view(),
    ),
    path("logout/", views.LogoutView.as_view()),
    path(
        "google/",
        views.GoogleLoginView.as_view(),
        name="google-login",
    ),
    # Profile management
   
    path("profile/", views.UserProfileView.as_view()),
]
