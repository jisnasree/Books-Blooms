1. Admin Management

Implemented admin-only access to management features.

Developed customer listing to view registered customers.

Added the ability to block and unblock customer accounts.

Worked on book management, including book details, authors, categories, formats, prices, stock, and availability.

Configured permissions to restrict administrative operations to authorized users.

2. User Profile Management

Implemented user profile retrieval and profile editing.

Added support for updating first name, last name, and phone number.

Added profile image upload and display.

Kept the email address read-only during profile editing.

Integrated the profile API with React Context to share user information across components.

3. Book Catalog

Integrated the book catalog with Django REST APIs.

Implemented book listing and book details pages.

Displayed book information, including title, author, description, cover image, rating, categories, and available formats.

Worked on category-based browsing and book search.

4. Shopping Cart

Implemented the cart using React and Django REST APIs.

Integrated authenticated API requests using token authentication.

Used React Context API to manage and share the cart count.

Updated the cart count after successfully adding a book.

Implemented cart refresh functionality to retrieve existing cart data when the application starts.