

from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/summary/",views.AdminDashboardSummaryView.as_view(),name="admin-dashboard-summary",),
    path("customers/", views.CustomerListView.as_view()),
    path("customers/<int:user_id>/block/", views.CustomerBlockView.as_view()),
]