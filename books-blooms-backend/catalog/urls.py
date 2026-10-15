from django.urls import path

from . import admin_views, views

urlpatterns = [
    path('books/', views.BookListView.as_view()),
        path(
        "admin/dashboard/summary/",
        admin_views.AdminDashboardSummaryView.as_view(),
        name="admin-dashboard-summary",
    ),
]