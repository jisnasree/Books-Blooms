
// URLS

export const BASE_URL = 'http://127.0.0.1:8000/api/'

export const AUTH_BASE_URL = BASE_URL + 'auth/'
export const AUTH_REGISTER_URL = AUTH_BASE_URL + 'register/'
// export const AUTH_ADMIN_LOGIN_URL = AUTH_BASE_URL + 'login/'
export const AUTH_LOGIN_URL = AUTH_BASE_URL + 'login/'
export const AUTH_FORGOT_PWD_URL = AUTH_BASE_URL + 'forgot-password/'
export const AUTH_SET_NEW_PWD_URL = AUTH_BASE_URL + 'forgot-password/set-new-password/'
export const AUTH_FORGOT_PWD_VERIFY_CODE_URL = AUTH_BASE_URL + 'forgot-password/verify-reset-code/'
export const AUTH_FORGOT_PWD_RESEND_CODE_URL  = AUTH_BASE_URL + 'forgot-password/resend-reset-code/'

export const AUTH_VERIFY_EMAIL_URL = AUTH_BASE_URL + 'register/verify-email/'
export const AUTH_EMAIL_RESEND_CODE_URL = AUTH_BASE_URL + 'register/resend-resetcode-email/'

export const AUTH_LOGOUT_URL = AUTH_BASE_URL + 'logout/'
export const AUTH_CUSTOMER_BLOCK_URL = AUTH_BASE_URL + 'customer/'
export const AUTH_CUSTOMERS_LIST_URL = AUTH_BASE_URL + 'customers/'
export const AUTH_PROFILE_URL = AUTH_BASE_URL + 'profile/'

export const CART_LIST_URL = BASE_URL + 'cart/'
export const ADD_TO_CART_URL = CART_LIST_URL + 'add-to-cart/'






export const ADMIN_BASE_URL = BASE_URL + 'admin/'
export const ADMIN_DASHBOARD_URL = ADMIN_BASE_URL + 'dashboard/summary/'


export const CATALOG_BASE_URL = BASE_URL + 'catalog/'
export const CATALOG_BOOKS_URL = CATALOG_BASE_URL + 'books/'
export const CATALOG_AUTHORS_URL = CATALOG_BASE_URL + 'authors/'
export const CATALOG_CATEGORIES_URL = CATALOG_BASE_URL + 'categories/'
export const WISHLIST_URL = CATALOG_BASE_URL + 'wishlist/'




// Error Messages
export const ERROR_UNABLE_TO_PROCESS = 'Unable to process your request.'


//UI ROUTES

export const HOME_URL = '/'
export const ADMIN_URL = '/admin'