from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model

from catalog.models import Book, Author, Category

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