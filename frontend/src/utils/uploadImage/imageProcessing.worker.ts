/// <reference lib="webworker" />

import { drawWatermark } from './drawWaterMark';

const WEBP_TYPE = 'image/webp';

type ImageProcessingWorkerRequest = {
  file: File;
  maxDimensionPx: number;
  watermarkText?: string;
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

const replaceFileExtension = (filename: string, extension: string) =>
  filename.replace(/\.[^.]+$/u, extension).concat(/\.[^.]+$/u.test(filename) ? '' : extension);

const processImage = async ({ file, maxDimensionPx, watermarkText }: ImageProcessingWorkerRequest): Promise<File> => {
  const image = await createImageBitmap(file);

  try {
    const scale = Math.min(1, maxDimensionPx / Math.max(image.width, image.height));

    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Браузер не поддерживает обработку изображений.');
    }

    context.drawImage(image, 0, 0, width, height);

    if (watermarkText) {
      drawWatermark(context, width, height, watermarkText);
    }

    const blob = await canvas.convertToBlob({
      type: WEBP_TYPE,
      quality: 0.92,
    });

    return new File([blob], replaceFileExtension(file.name, '.webp'), {
      type: WEBP_TYPE,
      lastModified: file.lastModified,
    });
  } finally {
    image.close();
  }
};

self.onmessage = async (event: MessageEvent<ImageProcessingWorkerRequest>) => {
  try {
    const normalizedFile = await processImage(event.data);

    self.postMessage({
      success: true,
      file: normalizedFile,
    } satisfies ImageProcessingWorkerResponse);
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось обработать изображение.',
    } satisfies ImageProcessingWorkerResponse);
  }
};
