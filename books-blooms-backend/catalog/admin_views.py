
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from .models import Book, Author, Category


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            "totalBooks": Book.objects.count(),
            "totalAuthors": Author.objects.count(),
            "totalCategories": Category.objects.count(),
        })
