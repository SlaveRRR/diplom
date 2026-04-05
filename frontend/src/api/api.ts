import axios from 'axios';

import {
  COMICS_CONFIRM_ENDPOINT,
  COMICS_UPLOAD_CONFIG_ENDPOINT,
  CURRENT_USER_ENDPOINT,
  LOGOUT_ENDPOINT,
  REFRESH_TOKEN_ENDPOINT,
  SIGNIN_ENDPOINT,
  SIGNUP_ENDPOINT,
  TAXONOMY_PLATFORM_ENDPOINT,
} from '@constants';
import {
  AccesTokenResponse,
  ComicConfirmPayload,
  ComicConfirmResponse,
  ComicUploadConfigPayload,
  ComicUploadConfigResponse,
  Response,
  SignInParams,
  SignUpParams,
  TaxonomyPlatformData,
  User,
} from '@types';

import { axiosInstance } from './utils';

class Api {
  async signIn(data: SignInParams) {
    return axiosInstance.post<AccesTokenResponse>(SIGNIN_ENDPOINT, data);
  }

  async signUp(data: SignUpParams) {
    return axiosInstance.post<AccesTokenResponse>(SIGNUP_ENDPOINT, data);
  }

  async refreshToken() {
    return axios.get<AccesTokenResponse>(REFRESH_TOKEN_ENDPOINT, { withCredentials: true });
  }

  async logout() {
    return axiosInstance.post(LOGOUT_ENDPOINT);
  }

  async getCurrentUser() {
    return axiosInstance.get<Response<User>>(CURRENT_USER_ENDPOINT);
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
}

export const api = new Api();
