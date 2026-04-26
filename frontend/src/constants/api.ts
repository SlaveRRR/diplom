export const API_ENDPOINT = import.meta.env.VITE_API;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const SIGNIN_ENDPOINT = `${API_ENDPOINT}/signin/`;

export const SIGNUP_ENDPOINT = `${API_ENDPOINT}/signup/`;
export const SIGNUP_RESEND_VERIFICATION_ENDPOINT = `${API_ENDPOINT}/signup/resend-verification/`;

export const REFRESH_TOKEN_ENDPOINT = `${API_ENDPOINT}/token/refresh/`;

export const LOGOUT_ENDPOINT = '/logout/';

export const SOCIAL_SESSION_EXCHANGE_ENDPOINT = '/social/exchange/';

export const CURRENT_USER_ENDPOINT = '/users/me/';
export const ACCOUNT_ENDPOINT = '/account/';
export const ACCOUNT_AVATAR_UPLOAD_CONFIG_ENDPOINT = '/account/avatar-upload-config/';
export const ACCOUNT_AVATAR_CONFIRM_ENDPOINT = '/account/avatar-confirm/';
export const NOTIFICATIONS_ENDPOINT = '/notifications/';
export const NOTIFICATIONS_READ_ENDPOINT = '/notifications/read/';
export const READING_HISTORY_ENDPOINT = '/history/';

export const getUserProfileEndpoint = (userId: string | number) => `/profiles/${userId}/`;

export const getUserFollowEndpoint = (userId: string | number) => `/profiles/${userId}/follow/`;

export const COMICS_UPLOAD_CONFIG_ENDPOINT = '/comics/upload-config/';

export const COMICS_CONFIRM_ENDPOINT = '/comics/confirm/';

export const TAXONOMY_PLATFORM_ENDPOINT = '/taxonomy';
export const BLOG_POSTS_ENDPOINT = '/posts/';
export const BLOG_TAGS_ENDPOINT = '/posts/tags/';
export const BLOG_UPLOAD_CONFIG_ENDPOINT = '/posts/upload-config/';
export const BLOG_CONFIRM_ENDPOINT = '/posts/confirm/';
export const getBlogPostEndpoint = (postId: string | number) => `/posts/${postId}/`;
export const getBlogPostEditorEndpoint = (postId: string | number) => `/posts/${postId}/editor/`;
export const getBlogPostCommentsEndpoint = (postId: string | number) => `/posts/${postId}/comments/`;

export const getComicDetailsEndpoint = (comicId: string | number) => `/comics/${comicId}/`;

export const getComicCommentsEndpoint = (comicId: string | number) => `/comics/${comicId}/comments/`;

export const getComicFavoriteEndpoint = (comicId: string | number) => `/comics/${comicId}/favorite/`;

export const getComicLikeEndpoint = (comicId: string | number) => `/comics/${comicId}/like/`;

export const COMICS_CATALOG_ENDPOINT = '/comics/';
export const FAVORITE_COMICS_ENDPOINT = '/favorites/';

export const getComicReaderEndpoint = (comicId: string | number, chapterId: string | number) =>
  `/comics/${comicId}/chapters/${chapterId}/reader/`;

export const getComicReadingProgressEndpoint = (comicId: string | number, chapterId: string | number) =>
  `/comics/${comicId}/chapters/${chapterId}/progress/`;
