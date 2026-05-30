/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_MAX_IMAGE_UPLOAD_SIZE_MB?: string;
  readonly VITE_MAX_IMAGE_DIMENSION_PX?: string;
  readonly VITE_MAX_COMIC_CHAPTERS?: string;
  readonly VITE_MAX_COMIC_PAGES_PER_CHAPTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
