import axios from 'axios';

import {
  ACCOUNT_AVATAR_CONFIRM_ENDPOINT,
  ACCOUNT_AVATAR_UPLOAD_CONFIG_ENDPOINT,
  ACCOUNT_ENDPOINT,
  BLOG_CONFIRM_ENDPOINT,
  BLOG_POSTS_ENDPOINT,
  BLOG_TAGS_ENDPOINT,
  BLOG_UPLOAD_CONFIG_ENDPOINT,
  COMICS_CATALOG_ENDPOINT,
  COMICS_CONFIRM_ENDPOINT,
  COMICS_UPLOAD_CONFIG_ENDPOINT,
  CURRENT_USER_ENDPOINT,
  FAVORITE_COMICS_ENDPOINT,
  getBlogPostCommentsEndpoint,
  getBlogPostEditorEndpoint,
  getBlogPostEndpoint,
  getComicCommentsEndpoint,
  getComicDetailsEndpoint,
  getComicFavoriteEndpoint,
  getComicLikeEndpoint,
  getComicReaderEndpoint,
  getComicReadingProgressEndpoint,
  getUserFollowEndpoint,
  getUserProfileEndpoint,
  LOGOUT_ENDPOINT,
  NOTIFICATIONS_ENDPOINT,
  NOTIFICATIONS_READ_ENDPOINT,
  READING_HISTORY_ENDPOINT,
  REFRESH_TOKEN_ENDPOINT,
  SIGNIN_ENDPOINT,
  SIGNUP_ENDPOINT,
  SIGNUP_RESEND_VERIFICATION_ENDPOINT,
  SOCIAL_SESSION_EXCHANGE_ENDPOINT,
  TAXONOMY_PLATFORM_ENDPOINT,
} from '@constants';
import {
  AccesTokenResponse,
  AvatarUploadConfigPayload,
  AvatarUploadConfigResponse,
  AvatarUploadConfirmPayload,
  AvatarUploadConfirmResponse,
  BlogComment,
  BlogCommentCreatePayload,
  BlogEditablePost,
  BlogPostConfirmPayload,
  BlogPostCreateResponse,
  BlogPostDetail,
  BlogPostListItem,
  BlogPostUploadConfigPayload,
  BlogPostUploadConfigResponse,
  BlogTag,
  CatalogComicResponse,
  ComicComment,
  ComicCommentCreatePayload,
  ComicConfirmPayload,
  ComicConfirmResponse,
  ComicDetailsResponse,
  ComicInteractionResponse,
  ComicReaderResponse,
  ComicReadingProgress,
  ComicUploadConfigPayload,
  ComicUploadConfigResponse,
  NotificationListResponse,
  NotificationMarkReadPayload,
  NotificationMarkReadResponse,
  ReadingHistoryResponse,
  Response,
  SignInParams,
  SignUpParams,
  TaxonomyPlatformData,
  User,
  UserAccount,
  UserFollowToggleResponse,
  UserProfile,
  UserProfileUpdatePayload,
  VerificationEmailResponse,
} from '@types';

import { axiosInstance } from './utils';

class Api {
  async signIn(data: SignInParams) {
    return axiosInstance.post<AccesTokenResponse>(SIGNIN_ENDPOINT, data);
  }

  async signUp(data: SignUpParams) {
    return axiosInstance.post<VerificationEmailResponse>(SIGNUP_ENDPOINT, data);
  }

  async resendVerificationEmail(email: string) {
    return axiosInstance.post<VerificationEmailResponse>(SIGNUP_RESEND_VERIFICATION_ENDPOINT, { email });
  }

  async refreshToken() {
    return axios.get<AccesTokenResponse>(REFRESH_TOKEN_ENDPOINT, { withCredentials: true });
  }

  async logout() {
    return axiosInstance.post(LOGOUT_ENDPOINT);
  }

  async exchangeSocialSession() {
    return axiosInstance.get<AccesTokenResponse>(SOCIAL_SESSION_EXCHANGE_ENDPOINT);
  }

  async getCurrentUser() {
    return axiosInstance.get<Response<User>>(CURRENT_USER_ENDPOINT);
  }

  async updateCurrentUser(data: UserProfileUpdatePayload) {
    return axiosInstance.put<User | Response<User>>(CURRENT_USER_ENDPOINT, data);
  }

  async getAccount() {
    return axiosInstance.get<Response<UserAccount>>(ACCOUNT_ENDPOINT);
  }

  async getAccountAvatarUploadConfig(data: AvatarUploadConfigPayload) {
    return axiosInstance.post<Response<AvatarUploadConfigResponse>>(ACCOUNT_AVATAR_UPLOAD_CONFIG_ENDPOINT, data);
  }

  async confirmAccountAvatarUpload(data: AvatarUploadConfirmPayload) {
    return axiosInstance.post<Response<AvatarUploadConfirmResponse>>(ACCOUNT_AVATAR_CONFIRM_ENDPOINT, data);
  }

  async getNotifications() {
    return axiosInstance.get<Response<NotificationListResponse>>(NOTIFICATIONS_ENDPOINT);
  }

  async markNotificationsRead(data: NotificationMarkReadPayload) {
    return axiosInstance.post<Response<NotificationMarkReadResponse>>(NOTIFICATIONS_READ_ENDPOINT, data);
  }

  async getReadingHistory() {
    return axiosInstance.get<Response<ReadingHistoryResponse>>(READING_HISTORY_ENDPOINT);
  }

  async getUserProfile(userId: string | number) {
    return axiosInstance.get<Response<UserProfile>>(getUserProfileEndpoint(userId));
  }

  async toggleUserFollow(userId: string | number) {
    return axiosInstance.post<Response<UserFollowToggleResponse>>(getUserFollowEndpoint(userId));
  }

  async getComicUploadConfig(data: ComicUploadConfigPayload) {
    return axiosInstance.post<Response<ComicUploadConfigResponse>>(COMICS_UPLOAD_CONFIG_ENDPOINT, data);
  }

  async confirmComicCreation(data: ComicConfirmPayload) {
    return axiosInstance.post<Response<ComicConfirmResponse>>(COMICS_CONFIRM_ENDPOINT, data);
  }

  async uploadFile(uploadUrl: string, file: File) {
    return axios.put(uploadUrl, file);
  }

  async getPlatformTaxonomy() {
    return axiosInstance.get<Response<TaxonomyPlatformData>>(TAXONOMY_PLATFORM_ENDPOINT);
  }

  async getBlogPosts() {
    return axiosInstance.get<Response<BlogPostListItem[]>>(BLOG_POSTS_ENDPOINT);
  }

  async getBlogTags() {
    return axiosInstance.get<Response<BlogTag[]>>(BLOG_TAGS_ENDPOINT);
  }

  async getBlogPost(postId: string | number, params?: { preview?: boolean }) {
    return axiosInstance.get<Response<BlogPostDetail>>(getBlogPostEndpoint(postId), {
      params: params?.preview ? { preview: 'true' } : undefined,
    });
  }

  async getEditableBlogPost(postId: string | number) {
    return axiosInstance.get<Response<BlogEditablePost>>(getBlogPostEditorEndpoint(postId));
  }

  async getBlogPostUploadConfig(data: BlogPostUploadConfigPayload) {
    return axiosInstance.post<Response<BlogPostUploadConfigResponse>>(BLOG_UPLOAD_CONFIG_ENDPOINT, data);
  }

  async confirmBlogPost(data: BlogPostConfirmPayload) {
    return axiosInstance.post<Response<BlogPostCreateResponse>>(BLOG_CONFIRM_ENDPOINT, data);
  }

  async createBlogComment(postId: string | number, data: BlogCommentCreatePayload) {
    return axiosInstance.post<Response<BlogComment>>(getBlogPostCommentsEndpoint(postId), data);
  }

  async getComicDetails(comicId: string | number) {
    return axiosInstance.get<Response<ComicDetailsResponse>>(getComicDetailsEndpoint(comicId));
  }

  async getCatalogComics() {
    return axiosInstance.get<Response<CatalogComicResponse[]>>(COMICS_CATALOG_ENDPOINT);
  }

  async getFavoriteComics() {
    return axiosInstance.get<Response<CatalogComicResponse[]>>(FAVORITE_COMICS_ENDPOINT);
  }

  async createComicComment(comicId: string | number, data: ComicCommentCreatePayload) {
    return axiosInstance.post<Response<ComicComment>>(getComicCommentsEndpoint(comicId), data);
  }

  async toggleComicFavorite(comicId: string | number) {
    return axiosInstance.post<Response<ComicInteractionResponse>>(getComicFavoriteEndpoint(comicId));
  }

  async toggleComicLike(comicId: string | number) {
    return axiosInstance.post<Response<ComicInteractionResponse>>(getComicLikeEndpoint(comicId));
  }

  async getComicReader(comicId: string | number, chapterId: string | number) {
    return axiosInstance.get<Response<ComicReaderResponse>>(getComicReaderEndpoint(comicId, chapterId));
  }

  async updateComicReadingProgress(comicId: string | number, chapterId: string | number, lastPage: number) {
    return axiosInstance.post<Response<ComicReadingProgress>>(getComicReadingProgressEndpoint(comicId, chapterId), {
      lastPage,
    });
  }
}

export const api = new Api();
