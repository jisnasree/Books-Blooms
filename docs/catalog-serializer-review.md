# Catalog Serializer Design Review

## Scope and method

This is a read-only design review of `books-blooms-backend/catalog/serializers.py`. The catalog models and API views were consulted to confirm how the serializers are used. No project code was changed.

## Findings

### High: `category_ids` is declared but excluded from the serializer fields

`BookSerializer` declares `category_ids` as a `PrimaryKeyRelatedField` at `books-blooms-backend/catalog/serializers.py:41`, but does not include it in `Meta.fields` at line 54. At runtime, evaluating the serializer raises:

> `AssertionError: The field 'category_ids' was declared on serializer BookSerializer, but has not been included in the 'fields' option.`

The book list/create and detail endpoints both use this serializer (`books-blooms-backend/catalog/views.py:11` and `:22`). Consequently, the mismatch prevents the book serializer from being used for normal API serialization and validation, rather than only disabling category input.

### Medium: Physical-variant fields have no update implementation

The serializer declares `format`, `price`, `currency`, and `stock_quantity` as write-only fields (`serializers.py:47-50`), then handles those values in its custom `create` method (`:79-105`). It does not override `update`.

The default `ModelSerializer.update` updates the `Book` instance; it does not update a related `PhysicalVariant`. Because these fields are not fields on `Book`, an update request containing them can appear to succeed without persisting the requested changes to a variant.

The API shape is also inconsistent: `physical_variants` is represented as a collection (`serializers.py:37-39`), while the create method accepts one set of variant properties and creates one variant. The model permits multiple variants per book (`catalog/models.py:42-50`). The serializer therefore does not define how clients should create or update several variants, or address a particular existing variant.

### Medium: Book and variant creation is not atomic

The custom `create` method saves the book, sets its categories, and then creates a physical variant in separate operations (`serializers.py:90-103`). If category assignment or variant creation fails after the book has been saved, prior database writes may remain. The API can be left with a book that does not have the variant expected from the submitted request.

### Low–Medium: Explicit `format` field omits the model length limit

The serializer explicitly defines `format` as a plain `CharField` (`serializers.py:47`), while the model declares `max_length=10` (`catalog/models.py:45`). Since the serializer field is explicitly declared, the model's limit is not automatically carried over to serializer validation. An overlong value may pass serializer validation and then be stored inconsistently or fail at persistence, depending on the database backend.

## Assessment

The `category_ids` declaration/field-list mismatch is the immediate blocker and should be addressed before the book endpoints can be considered operational. The next most significant concern is the incomplete lifecycle contract for physical variants: create accepts one variant, output returns a collection, and update has no defined behavior for the related records. Atomic creation and alignment of `format` validation with the model constraints are additional reliability concerns.

## Verification

- Confirmed serializer behavior by instantiating `BookSerializer` in the configured Django environment; it raised the `AssertionError` quoted above.
- Confirmed endpoint usage in `catalog/views.py` and related model constraints in `catalog/models.py`.
- No application or test files were modified as part of this review.

## Recommended Django Relationship Design Guide

### `Book.author`: the model relationship is appropriate

`Book.author` is a required `ForeignKey` to `Author`, with `on_delete=models.PROTECT` and `related_name="books"` (`catalog/models.py`). This represents the current rule that each book has exactly one author while an author may have many books. `PROTECT` is a sensible choice when an author referenced by a book should not be deleted accidentally. The serializer representation does not change this database relationship; it only defines how API clients read and submit it.

### A nested read-only serializer and a primary-key field serve different purposes

```python
author = AuthorSerializer(read_only=True)
```

This renders an author object in the response, for example `{"author": {"id": 12, "name": "A. Writer"}}`, but does not accept `author` as input. It is therefore unsuitable by itself for creating a book whose author is required, or for changing a book's author. Read-only nested serialization means “show related author data,” not “let the client select an author.”

```python
author = serializers.PrimaryKeyRelatedField(
    queryset=Author.objects.all()
)
```

This accepts an author primary key, validates that it identifies an existing `Author`, and returns that model instance in `validated_data`. It also represents the relationship as the primary key in responses. This is a good fit when a client selects an existing author from the authors endpoint.

For a `ModelSerializer`, an editable `ForeignKey` listed in `Meta.fields` is normally generated as a writable `PrimaryKeyRelatedField` automatically. In the current `BookSerializer`, `author` is listed, is not marked read-only, and has no explicit override, so the default field already provides this primary-key behavior. Declaring it explicitly is optional; it can make the API contract or queryset restrictions more visible.

### Recommendation for this API

Keep `author` as the writable primary-key relationship and keep a separate read-only display field such as the existing `author_name`. This keeps create/update requests simple and makes choosing an existing author unambiguous:

The following shows only the relationship field from a request; a complete create request must also include the other required book and variant fields.

```json
{
  "title": "Example Book",
  "author": 12
}
```

A response can include both the author ID and display name:

```json
{
  "title": "Example Book",
  "author": 12,
  "author_name": "A. Writer"
}
```

If clients later need more author details in the book response, expose them under a distinct read-only field such as `author_details`, using `AuthorSerializer`. Keep the write field separate (`author` as the ID, or an explicitly named `author_id`). Avoid making the nested author serializer writable merely to assign an existing author: writable nested relationships require custom create/update semantics and can accidentally turn author selection into author creation or mutation.

The API contract should use one consistent response shape. The catalog API design currently illustrates `author` as a name string, while this serializer's `author` is an ID and `author_name` is the display string. Choose and document the intended representation before clients depend on it; the recommendation above retains the existing serializer's ID field and makes the display name explicit.

### Categories: separate read representation from write identifiers

`Book.categories` is a many-to-many relationship through `BookCategory`. Returning nested category objects for reading and accepting category IDs for assignment is a sound pattern when clients need readable names but should select existing categories. The `BookCategory` unique constraint on `(book, category)` prevents duplicate assignments.

In this serializer, `categories` is read-only and `category_ids` is the intended write field. That split is reasonable, but `category_ids` must be included in `BookSerializer.Meta.fields`; its current omission is the assertion failure recorded above. If the through model later gains relationship-specific data (for example, ordering or assignment metadata), serialize the through rows explicitly instead of treating the relation as a plain list of category IDs.

### Physical variants: define a clear lifecycle contract

`PhysicalVariant.book` is a foreign key, so a book can have multiple variants. Returning the reverse relation as a read-only collection is appropriate for output. However, accepting one flat `format`/`price`/`stock_quantity` set during book creation does not define how clients create, identify, replace, or update multiple variants. Choose a deliberate write contract: manage variants through their own endpoints, or accept an explicit `variants` collection and implement/test the nested create and update semantics. Do not imply that flat fields update the collection unless the serializer actually implements that behavior.

An explicit `related_name="physical_variants"` on the model foreign key would make the reverse relation clearer and align it with the API field name; if adopted, update serializer/queryset references consistently. Add a uniqueness constraint such as `(book, format)` only if the product rule guarantees at most one variant of each format per book—do not infer that rule solely from the current model.

### Query and persistence considerations

When list/detail responses include related author, category, and variant data, optimize their queryset with `select_related("author")` and appropriate `prefetch_related(...)` calls. Otherwise, serializing a list can issue repeated queries for related data.

If one request is intended to create a book, category assignments, and its required variant as one logical operation, wrap those writes in a database transaction so a failure does not leave a partial result. Validate relationship IDs through related fields rather than accepting unchecked scalar values.
