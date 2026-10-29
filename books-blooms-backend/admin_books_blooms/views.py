from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model

from catalog.models import Book, Author, Category
from admin_books_blooms.serializers import CustomerSerializer

User = get_user_model()


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            "totalBooks": Book.objects.count(),
            "totalAuthors": Author.objects.count(),
            "totalCategories": Category.objects.count(),
            "totalCustomers": User.objects.count(),
        })

class CustomerListView(ListAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(is_staff=False, is_superuser=False).order_by(
            "-date_joined"
        )


class CustomerBlockView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):
        try:
            customer = User.objects.get(id=user_id, is_staff=False, is_superuser=False)
        except User.DoesNotExist:
            return Response(
                {"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND
            )

        is_blocked = request.data.get("is_blocked")

        if not isinstance(is_blocked, bool):
            return Response(
                {"error": "is_blocked must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer.is_blocked = is_blocked
        customer.save(update_fields=["is_blocked"])

        return Response(
            {
                "message": (
                    "Customer blocked successfully."
                    if is_blocked
                    else "Customer unblocked successfully."
                ),
                "is_blocked": customer.is_blocked,
            }
        )