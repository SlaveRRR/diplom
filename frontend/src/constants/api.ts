export const API_ENDPOINT = import.meta.env.VITE_API;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const SIGNIN_ENDPOINT = `${API_ENDPOINT}/signin/`;

export const SIGNUP_ENDPOINT = `${API_ENDPOINT}/signup/`;
export const SIGNUP_RESEND_VERIFICATION_ENDPOINT = `${API_ENDPOINT}/signup/resend-verification/`;

export const REFRESH_TOKEN_ENDPOINT = `${API_ENDPOINT}/token/refresh/`;

export const LOGOUT_ENDPOINT = '/logout/';

export const SOCIAL_SESSION_EXCHANGE_ENDPOINT = '/social/exchange/';

export const CURRENT_USER_ENDPOINT = '/users/me/';

export const COMICS_UPLOAD_CONFIG_ENDPOINT = '/comics/upload-config/';

export const COMICS_CONFIRM_ENDPOINT = '/comics/confirm/';

export const TAXONOMY_PLATFORM_ENDPOINT = '/taxonomy';
