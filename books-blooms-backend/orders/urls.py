from django.urls import path
from . import views

# GET  /api/orders/       — list the current user's orders, newest first
# POST /api/orders/       — create an order from the current user's cart
# GET  /api/orders/<pk>/  — retrieve one of the current user's orders
urlpatterns = [
    path("", views.OrderListCreateView.as_view()),
    path("<int:pk>/", views.OrderDetailView.as_view()),
    path("<int:order_id>/cancel/", views.OrderCancellationView.as_view()),
    path("<int:order_id>/create-payment/", views.RazorpayCreateOrderView.as_view()),
    path("<int:order_id>/verify-payment/", views.RazorpayVerifyPaymentView.as_view()),
    path("coupons/validate/", views.CouponValidateView.as_view()),
    # Admin coupon APIs (must be above admin/<int:pk>/)
    path("admin/coupons/", views.AdminCouponListCreateView.as_view()),
    path("admin/coupons/<int:pk>/", views.AdminCouponDetailView.as_view()),
    # Admin order APIs
    path("admin/", views.AdminOrderListView.as_view()),
    path("admin/<int:pk>/", views.AdminOrderDetailView.as_view()),
]
