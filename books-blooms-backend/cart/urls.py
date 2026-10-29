
from django.urls import path
from . import views

# GET /api/cart/ — retrieve the current user's cart
# GET /api/cart/items/ — list items in the cart
# POST /api/cart/items/ — add an item to the cart
# GET/PATCH/DELETE /api/cart/items/<pk>/ — retrieve, update, or remove one item
urlpatterns = [
    path("", views.CartListView.as_view()),
    path("items/", views.CartItemListCreateView.as_view()),
    path("items/<int:pk>/", views.CartItemDetailView.as_view()),
]
