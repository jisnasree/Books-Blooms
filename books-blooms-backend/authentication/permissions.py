from rest_framework.permissions import BasePermission


class IsNotBlocked(BasePermission):
    message = "Your account has been blocked."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return not getattr(user, "is_blocked", False)