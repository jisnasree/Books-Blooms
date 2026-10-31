from django.urls import path
from . import views

# GET  /api/orders/       — list the current user's orders, newest first
# POST /api/orders/       — create an order from the current user's cart
# GET  /api/orders/<pk>/  — retrieve one of the current user's orders
urlpatterns = [
    path("", views.OrderListCreateView.as_view()),
    path("<int:pk>/", views.OrderDetailView.as_view()),
    path("<int:order_id>/cancel/",views.OrderCancellationView.as_view()),
]