
from rest_framework.generics import ListAPIView, ListCreateAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticatedOrReadOnly
from .models import Book, Author
from .serializers import BookSerializer, AuthorSerializer


class BookListView(ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    # permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]
    

class AuthorsListView(ListAPIView):
    queryset = Author.objects.all().order_by("name")
    serializer_class = AuthorSerializer
