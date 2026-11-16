import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from catalog.models import Category

for category_id in [7, 8]:
    try:
        category = Category.objects.get(id=category_id)
        print(f"\nCategory: {category.name}, ID: {category.id}")

        # ManyToMany relation through BookCategory
        books_count = category.books.count()
        print(f"  Books: {books_count}")

        # ForeignKey from Offer
        offers_count = category.offers.count()
        print(f"  Offers: {offers_count}")

    except Category.DoesNotExist:
        print(f"\nCategory with ID {category_id} not found")