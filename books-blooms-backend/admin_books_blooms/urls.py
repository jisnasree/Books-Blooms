

from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/summary/",views.AdminDashboardSummaryView.as_view(),name="admin-dashboard-summary",),
    # path("books/",views.AdminDashboardSummaryView.as_view(),name="admin-dashboard-summary",),
]