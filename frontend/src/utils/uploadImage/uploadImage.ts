const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

const parseNumericEnv = (value: string | undefined, fallback: number) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const getDefaultImageProcessingConcurrency = () => {
  const hardwareConcurrency =
    typeof navigator !== 'undefined' && Number.isFinite(navigator.hardwareConcurrency)
      ? navigator.hardwareConcurrency
      : 4;

  return Math.min(4, Math.max(2, Math.floor(hardwareConcurrency / 2)));
};

export const MAX_IMAGE_UPLOAD_SIZE_MB = parseNumericEnv(import.meta.env.VITE_MAX_IMAGE_UPLOAD_SIZE_MB, 5);
export const MAX_IMAGE_UPLOAD_SIZE_BYTES = MAX_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024;
export const MAX_IMAGE_DIMENSION_PX = parseNumericEnv(import.meta.env.VITE_MAX_IMAGE_DIMENSION_PX, 4000);
export const MAX_COMIC_CHAPTERS = parseNumericEnv(import.meta.env.VITE_MAX_COMIC_CHAPTERS, 50);
export const MAX_COMIC_PAGES_PER_CHAPTER = parseNumericEnv(import.meta.env.VITE_MAX_COMIC_PAGES_PER_CHAPTER, 50);
const IMAGE_PROCESSING_CONCURRENCY = parseNumericEnv(
  import.meta.env.VITE_IMAGE_PROCESSING_CONCURRENCY,
  getDefaultImageProcessingConcurrency(),
);

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

type WorkerTask = {
  file: File;
  reject: (reason?: unknown) => void;
  resolve: (file: File) => void;
};

type WorkerSlot = {
  isBusy: boolean;
  worker: Worker;
};

type NormalizeProgressHandler = (processedCount: number, totalCount: number) => void;

type NormalizeOptions = {
  onProgress?: NormalizeProgressHandler;
};

const WORKER_ERROR_MESSAGE = 'Не удалось обработать изображение. Попробуйте другой файл.';

const createImageProcessingWorker = () =>
  new Worker(new URL('./imageProcessing.worker.ts', import.meta.url), {
    type: 'module',
  });

const workerPool: WorkerSlot[] = Array.from({ length: IMAGE_PROCESSING_CONCURRENCY }, () => ({
  worker: createImageProcessingWorker(),
  isBusy: false,
}));
const workerTaskQueue: WorkerTask[] = [];

const runNextWorkerTask = (slot: WorkerSlot) => {
  if (slot.isBusy) {
    return;
  }

  const nextTask = workerTaskQueue.shift();
  if (!nextTask) {
    return;
  }

  slot.isBusy = true;

  const completeTask = (callback: () => void) => {
    slot.worker.onmessage = null;
    slot.worker.onerror = null;
    slot.isBusy = false;
    callback();
    runNextWorkerTask(slot);
  };

  slot.worker.onmessage = (event: MessageEvent<ImageProcessingWorkerResponse>) => {
    const payload = event.data;

    completeTask(() => {
      if (payload.success) {
        nextTask.resolve(payload.file);
        return;
      }

      nextTask.reject(new Error((payload as Extract<ImageProcessingWorkerResponse, { success: false }>).error));
    });
  };

  slot.worker.onerror = () => {
    completeTask(() => {
      nextTask.reject(new Error(WORKER_ERROR_MESSAGE));
    });
  };

  slot.worker.postMessage({
    file: nextTask.file,
    maxDimensionPx: MAX_IMAGE_DIMENSION_PX,
  });
};

const processImageInWorker = (file: File) =>
  new Promise<File>((resolve, reject) => {
    workerTaskQueue.push({
      file,
      reject,
      resolve,
    });

    const availableSlot = workerPool.find((slot) => !slot.isBusy);
    if (availableSlot) {
      runNextWorkerTask(availableSlot);
    }
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

export const normalizeUploadImages = async (files: File[], options: NormalizeOptions = {}) => {
  const normalizedFiles = new Array<File>(files.length);
  let nextIndex = 0;
  let processedCount = 0;

  const runQueue = async () => {
    while (nextIndex < files.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      normalizedFiles[currentIndex] = await normalizeUploadImage(files[currentIndex]);
      processedCount += 1;
      options.onProgress?.(processedCount, files.length);
    }
  };

  const workersCount = Math.min(IMAGE_PROCESSING_CONCURRENCY, files.length);
  await Promise.all(Array.from({ length: workersCount }, () => runQueue()));

  return normalizedFiles;
};

export const normalizeUploadImagesSettled = async (files: File[], options: NormalizeOptions = {}) => {
  const results = new Array<{ file?: File; error?: Error }>(files.length);
  let nextIndex = 0;
  let processedCount = 0;

  const runQueue = async () => {
    while (nextIndex < files.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      try {
        results[currentIndex] = {
          file: await normalizeUploadImage(files[currentIndex]),
        };
      } catch (error) {
        results[currentIndex] = {
          error: error instanceof Error ? error : new Error('Не удалось обработать изображение.'),
        };
      } finally {
        processedCount += 1;
        options.onProgress?.(processedCount, files.length);
      }
    }
  };

  const workersCount = Math.min(IMAGE_PROCESSING_CONCURRENCY, files.length);
  await Promise.all(Array.from({ length: workersCount }, () => runQueue()));

  return results;
};

export const getAllowedImageAccept = () => 'image/png,image/jpeg,image/webp';
