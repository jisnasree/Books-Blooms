# API Docs

## Personas

### Unauthenticated User

### Authenticated end user

### Admin ( Authenticated )

### Super User ( only one )

## Pages / Features vs Personas

|  Page | Features | Personas |
|---|---|---|
| Login | Login, Register | UnAuthenticated , Authenticated, Admin |
| Home | booklist | UnAuthenticated, Authenticated, Admin|
| Admin Dashboard | Admin management for books, users etc | Admin |


## Pages and APIs used in the page

| API path | Methods supported | Page(s) using the API | Access |
|---|---|---|---|
| `/api/catalog/books/` | `GET`, `POST` | Home (`GET`); no frontend page currently sends `POST` | `GET` is unprotected; `POST` requires authentication |
| `/api/catalog/authors/` | `GET` | No frontend page currently uses this endpoint | Unprotected |
| `/api/admin/dashboard/summary/` | `GET` | Admin Dashboard | Protected (admin user required) |
| `/api/admin/books/` | `GET` | Admin Books page is not currently connected to this endpoint | Protected (admin user required) |
| `/api/auth/register/` | `POST` | Register | Unprotected |
| `/api/auth/register/verify-email/` | `POST` | Verify Email | Unprotected |
| `/api/auth/register/resend-code/` | `POST` | No page currently sends this request; the resend button is not wired | Unprotected |
| `/api/auth/login/` | `POST` | Login | Unprotected |
| `/api/auth/forgot/` | `POST` | Forgot Password | Unprotected |
| `/api/auth/forgot/verify-reset-code/` | `POST` | Verify Reset Code | Unprotected |
| `/api/auth/forgot/set-new-password/` | `POST` | Set New Password | Unprotected |

Access is based on the current backend permission classes. “Unprotected” means the endpoint does not require an authenticated user; it does not mean that the request has no validation.
