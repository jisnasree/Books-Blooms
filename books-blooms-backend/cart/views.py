
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    UpdateCartItemSerializer,
)


class CartDetailView(RetrieveAPIView):
    """
    Purpose:
    Retrieve the logged-in user's cart.

    GET /api/cart/

    If the user does not have a cart yet, create one.
    A user can access only their own cart.
    """
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Get the current user's cart.
        # Create a cart if the user does not have one.
        cart, created = Cart.objects.get_or_create(
            user=self.request.user
        )

        # Return the cart so DRF can serialize it.
        return cart


class AddToCartView(APIView):
    """
    Purpose:
    Add a book format to the logged-in user's cart.

    POST /api/cart/items/

    Validates availability and stock.
    If the same variant is already in the cart,
    increase its quantity instead of creating a duplicate item.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Validate the submitted variant ID and quantity.
        serializer = CartItemSerializer(data=request.data)
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
        cart, created = Cart.objects.get_or_create(
            user=request.user
        )

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
            status=status.HTTP_200_OK,
        )


class UpdateCartItemView(APIView):
    """
    Purpose:
    Change the quantity of an existing cart item.

    PATCH /api/cart/items/<item_id>/

    Only the owner of the cart can update its items.
    The new quantity must not exceed available stock.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        # Find the cart item only if it belongs to this user.
        # Return 404 if the item does not exist or belongs to another user.
        cart_item = get_object_or_404(
            CartItem,
            id=item_id,
            cart__user=request.user,
        )

        # Validate the new quantity.
        serializer = UpdateCartItemSerializer(
            cart_item,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        # Reject quantities greater than the available stock.
        if (
            serializer.validated_data["quantity"]
            > cart_item.variant.stock_quantity
        ):
            return Response(
                {"error": "Not enough stock available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save the new quantity to the database.
        serializer.save()

        # Return the updated cart.
        return Response(
            CartSerializer(cart_item.cart).data,
            status=status.HTTP_200_OK,
        )


class DeleteCartItemView(APIView):
    """
    Purpose:
    Remove an item from the logged-in user's cart.

    DELETE /api/cart/items/<item_id>/delete/

    Deletes only the cart item, not the book or its stock.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        # Find the item only if it belongs to this user.
        cart_item = get_object_or_404(
            CartItem,
            id=item_id,
            cart__user=request.user,
        )

        # Keep a reference to the cart before deleting the item.
        cart = cart_item.cart

        # Remove the CartItem record from the database.
        cart_item.delete()

        # Return the cart after the item has been removed.
        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_200_OK,
        )
