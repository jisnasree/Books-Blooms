
// URLS

export const BASE_URL = 'http://127.0.0.1:8000/api/'

export const AUTH_BASE_URL = BASE_URL + 'auth/'
export const AUTH_REGISTER_URL = AUTH_BASE_URL + 'register/'
export const AUTH_LOGIN_URL = AUTH_BASE_URL + 'login/'
export const AUTH_FORGOT_PWD_URL = AUTH_BASE_URL + 'forgot/'
export const AUTH_SET_NEW_PWD_URL = AUTH_BASE_URL + 'forgot/set-new-password/'
export const AUTH_VERIFY_CODE_URL = AUTH_BASE_URL + 'forgot/verify-reset-code/'
export const AUTH_VERIFY_EMAIL_URL = AUTH_BASE_URL + 'register/verify-email/'
export const AUTH_RESEND_CODE_URL = AUTH_BASE_URL + 'register/resend-code/'

export const ADMIN_BASE_URL = BASE_URL + 'admin/'
export const ADMIN_DASHBOARD_URL = ADMIN_BASE_URL + 'dashboard/summary/'

// Error Messages
export const ERROR_UNABLE_TO_PROCESS = 'Unable to process your request.'