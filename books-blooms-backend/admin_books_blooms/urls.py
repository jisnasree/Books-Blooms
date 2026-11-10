

from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/summary/",views.AdminDashboardSummaryView.as_view(),name="admin-dashboard-summary",),
    path("customers/", views.CustomerListView.as_view()),
    path("customers/<int:user_id>/block/", views.CustomerBlockView.as_view()),
    # Admin coupon APIs (must be above admin/<int:pk>/)
    path("coupons/", views.AdminCouponListCreateView.as_view()),
    path("coupons/<int:pk>/", views.AdminCouponDetailView.as_view()),
    # Admin order APIs
    path("orders/", views.AdminOrderListView.as_view()),
    path("orders/<int:pk>/", views.AdminOrderDetailView.as_view()),
]