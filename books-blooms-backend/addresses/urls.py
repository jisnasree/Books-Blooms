from django.urls import path
from . import views

urlpatterns = [
    # address URLs
    path("", views.AddressListCreateView.as_view()),
    path("<int:pk>/", views.AddressDetailView.as_view()),
]