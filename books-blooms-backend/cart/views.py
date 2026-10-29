from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    UpdateCartItemSerializer,
)


class CartListView(RetrieveAPIView):
    """
    Retrieve the logged-in user's cart.
    If the user does not have a cart yet, create one.
    A user can access only their own cart.
    """

    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Get the current user's cart.
        # Create a cart if the user does not have one.
        cart, created = Cart.objects.get_or_create(user=self.request.user)

        # Return the cart so DRF can serialize it.
        return cart


class CartItemListCreateView(ListCreateAPIView):
    """
    GET /api/cart/items/ lists the items in the user's cart.
    POST /api/cart/items/ adds a book format to the user's cart.

    Validates availability and stock.
    If the same variant is already in the cart,
    increase its quantity instead of creating a duplicate item.
    Returns the full cart so the client can refresh totals.
    """

    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(
            cart__user=self.request.user
        ).select_related("variant", "variant__book", "variant__book__author")

    def create(self, request, *args, **kwargs):
        # Validate the submitted variant ID and quantity.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the PhysicalVariant object and requested quantity.
        variant = serializer.validated_data["variant"]
        quantity = serializer.validated_data["quantity"]

        # Do not allow unavailable book formats.
        if not variant.is_available:
            return Response(
                {"error": "This book format is currently unavailable."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check whether the requested quantity is in stock.
        if quantity > variant.stock_quantity:
            return Response(
                {"error": "Not enough stock available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or create the logged-in user's cart.
        cart, created = Cart.objects.get_or_create(user=request.user)

        # Find the existing cart item or create a new one.
        # defaults applies only when a new item is created.
        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            variant=variant,
            defaults={"quantity": quantity},
        )

        # If the item already existed, add the requested quantity.
        if not item_created:
            new_quantity = cart_item.quantity + quantity

            # Check the combined quantity against available stock.
            if new_quantity > variant.stock_quantity:
                return Response(
                    {"error": "Not enough stock available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Save the increased quantity.
            cart_item.quantity = new_quantity
            cart_item.save()

        # Return the updated cart to the client.
        return Response(
            CartSerializer(cart).data,
            status=(
                status.HTTP_201_CREATED
                if item_created
                else status.HTTP_200_OK
            ),
        )


class CartItemDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET /api/cart/items/<pk>/ retrieves one cart item.
    PATCH /api/cart/items/<pk>/ changes its quantity.
    DELETE /api/cart/items/<pk>/ removes it from the cart.

    Scoped to the owner's cart: items belonging to other users
    return 404. Mutations return the full updated cart with 200
    (instead of DRF's default 204 on delete) because the frontend
    refreshes totals from the response body.
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(
            cart__user=self.request.user
        ).select_related("variant", "variant__book", "variant__book__author")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UpdateCartItemSerializer
        return CartItemSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        cart_item = self.get_object()

        # Validate the new quantity.
        serializer = self.get_serializer(
            cart_item,
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)

        # Reject quantities greater than the available stock.
        quantity = serializer.validated_data.get("quantity")
        if (
            quantity is not None
            and quantity > cart_item.variant.stock_quantity
        ):
            return Response(
                {"error": "Not enough stock available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        # Return the updated cart.
        return Response(
            CartSerializer(cart_item.cart).data,
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        cart_item = self.get_object()

        # Keep a reference to the cart before deleting the item.
        cart = cart_item.cart

        self.perform_destroy(cart_item)

        # Return the cart after the item has been removed.
        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_200_OK,
        )
