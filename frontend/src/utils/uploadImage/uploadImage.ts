const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

const parseNumericEnv = (value: string | undefined, fallback: number) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

export const MAX_IMAGE_UPLOAD_SIZE_MB = parseNumericEnv(import.meta.env.VITE_MAX_IMAGE_UPLOAD_SIZE_MB, 5);
export const MAX_IMAGE_UPLOAD_SIZE_BYTES = MAX_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024;
export const MAX_IMAGE_DIMENSION_PX = parseNumericEnv(import.meta.env.VITE_MAX_IMAGE_DIMENSION_PX, 4000);
export const MAX_COMIC_CHAPTERS = parseNumericEnv(import.meta.env.VITE_MAX_COMIC_CHAPTERS, 50);
export const MAX_COMIC_PAGES_PER_CHAPTER = parseNumericEnv(import.meta.env.VITE_MAX_COMIC_PAGES_PER_CHAPTER, 50);

const fileTypeLabelMap: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
};

type ImageProcessingWorkerResponse =
  | {
      success: true;
      file: File;
    }
  | {
      success: false;
      error: string;
    };

const createImageProcessingWorker = () =>
  new Worker(new URL('./imageProcessing.worker.ts', import.meta.url), {
    type: 'module',
  });

const processImageInWorker = (file: File) =>
  new Promise<File>((resolve, reject) => {
    const worker = createImageProcessingWorker();

    worker.onmessage = (event: MessageEvent<ImageProcessingWorkerResponse>) => {
      const payload = event.data;
      worker.terminate();

      if (payload.success) {
        resolve(payload.file);
        return;
      }

      reject(new Error((payload as Extract<ImageProcessingWorkerResponse, { success: false }>).error));
    };

    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Не удалось обработать изображение. Попробуйте другой файл.'));
    };

    worker.postMessage({
      file,
      maxDimensionPx: MAX_IMAGE_DIMENSION_PX,
    });
  });

const assertValidImage = (file: File) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error(
      `Поддерживаются только изображения ${ALLOWED_IMAGE_TYPES.map((type) => fileTypeLabelMap[type]).join(', ')}.`,
    );
  }

  if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    throw new Error(`Размер исходного изображения не должен превышать ${MAX_IMAGE_UPLOAD_SIZE_MB} МБ.`);
  }
};

export const normalizeUploadImage = async (file: File) => {
  assertValidImage(file);

  const normalizedFile = await processImageInWorker(file);

  if (normalizedFile.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    throw new Error(
      `После обработки изображение превышает ${MAX_IMAGE_UPLOAD_SIZE_MB} МБ. Выберите файл меньшего размера.`,
    );
  }

  return normalizedFile;
};

export const getAllowedImageAccept = () => 'image/png,image/jpeg,image/webp';
