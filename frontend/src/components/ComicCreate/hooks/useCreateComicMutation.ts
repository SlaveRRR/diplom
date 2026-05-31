import { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { OutletContext } from '@pages';
import { ComicConfirmResponse, ComicUploadConfigPayload } from '@types';
import { ACCOUNT_QUERY_KEY } from '@components/Account/hooks/useAccountQuery';
import { CURRENT_USER_QUERY_KEY } from '@hooks/useCurrentUser';

import { ComicUploadState, CreateComicPayload } from '../types';

const getFilePayload = (file: File) => ({
  filename: file.name,
  content_type: file.type || 'application/octet-stream',
});

const getAssetPayload = (asset: CreateComicPayload['cover']) => {
  if (asset.file) {
    return getFilePayload(asset.file);
  }

  return {
    existingKey: asset.storageKey,
  };
};

const initialUploadState: ComicUploadState = {
  stage: 'idle',
  uploadedFiles: 0,
  totalFiles: 0,
  isDraftLocked: false,
  lockedDraftId: null,
  errorMessage: null,
};

export const useCreateComicMutation = () => {
  const { messageApi } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();
  const [uploadState, setUploadState] = useState<ComicUploadState>(initialUploadState);
  const lockedDraftIdRef = useRef<string | null>(null);

  const clearUploadLock = () => {
    lockedDraftIdRef.current = null;
    setUploadState(initialUploadState);
  };

  const mutation = useMutation({
    mutationFn: async (payload: CreateComicPayload): Promise<ComicConfirmResponse> => {
      if (lockedDraftIdRef.current) {
        throw new Error(
          'Предыдущая загрузка завершилась ошибкой после создания upload-config. Сбросьте форму, чтобы начать заново.',
        );
      }

      const totalUploadFiles =
        (payload.cover.file ? 1 : 0) +
        (payload.banner.file ? 1 : 0) +
        payload.chapters.reduce(
          (total, chapter) => total + chapter.pages.filter((page) => Boolean(page.file)).length,
          0,
        );

      setUploadState({
        stage: 'config',
        uploadedFiles: 0,
        totalFiles: totalUploadFiles,
        isDraftLocked: false,
        lockedDraftId: null,
        errorMessage: null,
      });

      const uploadPayload: ComicUploadConfigPayload = {
        comicId: payload.comicId,
        genreId: payload.genreId,
        title: payload.title,
        description: payload.description,
        ageRating: payload.ageRating,
        tagIds: payload.tagIds,
        cover: getAssetPayload(payload.cover),
        banner: getAssetPayload(payload.banner),
        chapters: payload.chapters.map((chapter) => ({
          title: chapter.title,
          description: chapter.description,
          chapter_number: chapter.chapterNumber,
          pages: chapter.pages.map((page) =>
            page.file ? getFilePayload(page.file) : { existingKey: page.storageKey },
          ),
        })),
      };

      let createdDraftId: string | null = null;

      try {
        const uploadConfigResponse = await api.getComicUploadConfig(uploadPayload);
        const uploadConfig = uploadConfigResponse.data.data;
        createdDraftId = uploadConfig.comic_draft_id;
        lockedDraftIdRef.current = createdDraftId;

        const uploadEntries = [
          ...(uploadConfig.cover && payload.cover.file
            ? [
                {
                  file: payload.cover.file,
                  uploadUrl: uploadConfig.cover.upload_url,
                },
              ]
            : []),
          ...(uploadConfig.banner && payload.banner.file
            ? [
                {
                  file: payload.banner.file,
                  uploadUrl: uploadConfig.banner.upload_url,
                },
              ]
            : []),
          ...uploadConfig.chapters.flatMap((chapterUpload) => {
            const chapter = payload.chapters.find((item) => item.chapterNumber === chapterUpload.chapter_number);

            if (!chapter) {
              throw new Error(`Не удалось сопоставить главу ${chapterUpload.chapter_number} с конфигом загрузки.`);
            }

            return chapterUpload.pages.map((pageUpload) => {
              const page = chapter.pages[pageUpload.page_index];

              if (!page) {
                throw new Error(
                  `Не удалось найти страницу ${pageUpload.page_index + 1} для главы ${chapterUpload.chapter_number}.`,
                );
              }

              if (!page.file) {
                throw new Error('Ожидалась новая страница, но ее файл отсутствует.');
              }

              return {
                file: page.file,
                uploadUrl: pageUpload.upload_url,
              };
            });
          }),
        ];

        setUploadState((prevState) => ({
          ...prevState,
          stage: 'upload',
          lockedDraftId: createdDraftId,
        }));

        for (const [index, uploadEntry] of uploadEntries.entries()) {
          await api.uploadFile(uploadEntry.uploadUrl, uploadEntry.file);

          setUploadState((prevState) => ({
            ...prevState,
            uploadedFiles: index + 1,
          }));
        }

        setUploadState((prevState) => ({
          ...prevState,
          stage: 'confirm',
        }));

        const confirmResponse = await api.confirmComicCreation({
          comic_draft_id: uploadConfig.comic_draft_id,
          comic_id: payload.comicId,
          submission_mode: payload.submissionMode,
        });

        return confirmResponse.data.data;
      } catch (error) {
        const message =
          error instanceof Error && error.message ? error.message : 'Не удалось завершить создание комикса.';

        if (createdDraftId) {
          setUploadState({
            stage: 'idle',
            uploadedFiles: 0,
            totalFiles: 0,
            isDraftLocked: true,
            lockedDraftId: createdDraftId,
            errorMessage: message,
          });
        } else {
          lockedDraftIdRef.current = null;
          setUploadState(initialUploadState);
        }

        throw error;
      }
    },
    onError: (error: Error) => {
      messageApi.error(error.message || 'Не удалось создать комикс.');
    },
    onSuccess: () => {
      lockedDraftIdRef.current = null;
      setUploadState(initialUploadState);
      queryClient.invalidateQueries([CURRENT_USER_QUERY_KEY]);
      queryClient.invalidateQueries([ACCOUNT_QUERY_KEY]);
    },
  });

  return {
    mutation,
    uploadState,
    clearUploadLock,
  };
};
