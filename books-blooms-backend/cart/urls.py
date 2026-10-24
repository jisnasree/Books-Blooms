
from django.urls import path
from . import views

urlpatterns = [
    path("", views.CartDetailView.as_view()),
    path("items/", views.AddToCartView.as_view()),
    path("items/<int:item_id>/", views.UpdateCartItemView.as_view()),
    path("items/<int:item_id>/delete/", views.DeleteCartItemView.as_view()),
]
