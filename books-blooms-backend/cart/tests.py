from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from catalog.models import Author, Book, PhysicalVariant
from .models import Cart, CartItem

User = get_user_model()

CART_URL = "/api/cart/"
CART_ITEMS_URL = "/api/cart/items/"


def item_url(item_id):
    return f"{CART_ITEMS_URL}{item_id}/"


class CartAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="reader",
            email="reader@example.com",
            password="pass1234",
        )
        self.other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="pass1234",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        author = Author.objects.create(name="James Clear")
        self.book = Book.objects.create(
            title="Atomic Habits",
            author=author,
            description="A book about habits.",
        )
        self.variant = PhysicalVariant.objects.create(
            book=self.book,
            format="hardcover",
            price="2249.00",
            stock_quantity=5,
        )
        self.unavailable_variant = PhysicalVariant.objects.create(
            book=self.book,
            format="paperback",
            price="999.00",
            stock_quantity=3,
            is_available=False,
        )

    def add_item(self, variant, quantity):
        return self.client.post(
            CART_ITEMS_URL,
            {"variant": variant.id, "quantity": quantity},
        )

    def create_item(self, user, quantity=1):
        cart = Cart.objects.create(user=user)
        return CartItem.objects.create(
            cart=cart, variant=self.variant, quantity=quantity
        )

    def test_get_cart_creates_empty_cart(self):
        response = self.client.get(CART_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertTrue(Cart.objects.filter(user=self.user).exists())

    def test_cart_requires_authentication(self):
        self.client.credentials()

        self.assertEqual(
            self.client.get(CART_URL).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(
            self.client.get(CART_ITEMS_URL).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_add_item_returns_201_and_cart(self):
        response = self.add_item(self.variant, 2)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["quantity"], 2)

    def test_add_existing_variant_consolidates_with_200(self):
        self.add_item(self.variant, 1)

        response = self.add_item(self.variant, 2)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["quantity"], 3)

    def test_add_item_rejects_quantity_over_stock(self):
        response = self.add_item(self.variant, 6)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_consolidation_rejects_combined_quantity_over_stock(self):
        self.add_item(self.variant, 4)

        response = self.add_item(self.variant, 2)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_item_rejects_unavailable_variant(self):
        response = self.add_item(self.unavailable_variant, 1)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_item_rejects_zero_quantity(self):
        response = self.add_item(self.variant, 0)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_items_returns_only_own_items(self):
        self.create_item(self.user, quantity=1)
        self.create_item(self.other_user, quantity=4)

        response = self.client.get(CART_ITEMS_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["quantity"], 1)

    def test_patch_item_updates_quantity(self):
        item = self.create_item(self.user, quantity=1)

        response = self.client.patch(item_url(item.id), {"quantity": 3})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"][0]["quantity"], 3)

    def test_patch_item_rejects_quantity_over_stock(self):
        item = self.create_item(self.user, quantity=1)

        response = self.client.patch(item_url(item.id), {"quantity": 6})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_item_returns_updated_cart(self):
        item = self.create_item(self.user, quantity=1)

        response = self.client.delete(item_url(item.id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertFalse(CartItem.objects.filter(id=item.id).exists())

    def test_cannot_modify_other_users_item(self):
        item = self.create_item(self.other_user, quantity=1)

        patch_response = self.client.patch(item_url(item.id), {"quantity": 2})
        delete_response = self.client.delete(item_url(item.id))

        self.assertEqual(patch_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(delete_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(CartItem.objects.filter(id=item.id).exists())
