from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model

from catalog.models import Book, Author, Category
from orders.models import Order, Coupon
from orders.serializers import CouponSerializer, OrderSerializer
from admin_books_blooms.serializers import AdminOrderStatusSerializer, CustomerSerializer

User = get_user_model()


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(
            {
                "totalBooks": Book.objects.count(),
                "totalAuthors": Author.objects.count(),
                "totalCategories": Category.objects.count(),
                "totalCustomers": User.objects.count(),
                "totalOrders": Order.objects.count(),
                "totalCoupons": Coupon.objects.count(),
            }
        )


class CustomerListView(ListAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(is_staff=False, is_superuser=False).order_by(
            "-date_joined"
        )


class CustomerBlockView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):
        try:
            customer = User.objects.get(id=user_id, is_staff=False, is_superuser=False)
        except User.DoesNotExist:
            return Response(
                {"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND
            )

        is_blocked = request.data.get("is_blocked")

        if not isinstance(is_blocked, bool):
            return Response(
                {"error": "is_blocked must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer.is_blocked = is_blocked
        customer.save(update_fields=["is_blocked"])
        if is_blocked:
            Token.objects.filter(user=customer).delete()

        return Response(
            {
                "message": (
                    "Customer blocked successfully."
                    if is_blocked
                    else "Customer unblocked successfully."
                ),
                "is_blocked": customer.is_blocked,
            }
        )


class AdminOrderPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminOrderListView(ListAPIView):
    """
    GET /api/admin/orders/
    Returns customer orders with search, filtering,
    sorting, and pagination.
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    # Enable search, filtering, and sorting
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    # Fields available for exact filtering
    filterset_fields = [
        "order_status",
        "payment_status",
        "payment_method",
    ]

    # Fields available for searching
    search_fields = [
        "=id",
        "user__first_name",
        "user__last_name",
        "user__email",
    ]

    # Fields available for sorting
    ordering_fields = [
        "created_at",
        "total_amount",
        "order_status",
        "payment_status",
    ]

    # Default sorting
    ordering = ["-created_at"]

    # Pagination
    pagination_class = AdminOrderPagination

    def get_queryset(self):
        return (
            Order.objects.select_related("user")
            .prefetch_related("items")
            .order_by("-created_at")
        )


class AdminOrderDetailView(RetrieveUpdateAPIView):
    """
    GET   /api/orders/admin/<pk>/  - Retrieve order details
    PATCH /api/orders/admin/<pk>/  - Update order status
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return Order.objects.select_related("user").prefetch_related("items")

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AdminOrderStatusSerializer

        return OrderSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return the complete updated order details
        return Response(OrderSerializer(instance).data, status=status.HTTP_200_OK)


class AdminCouponListCreateView(ListCreateAPIView):
    """
    GET  /api/orders/admin/coupons/       — list all coupons
    POST /api/orders/admin/coupons/       — create a coupon
    """

    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Coupon.objects.all().order_by("code")


class AdminCouponDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET/PATCH/DELETE /api/orders/admin/coupons/<pk>/
    """

    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Coupon.objects.all()