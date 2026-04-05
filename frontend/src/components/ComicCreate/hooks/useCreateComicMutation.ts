import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { CURRENT_USER_QUERY_KEY } from '@hooks';
import { OutletContext } from '@pages';
import { ComicConfirmResponse, ComicUploadConfigPayload } from '@types';

import { ComicUploadState, CreateComicPayload } from '../types';

const getFilePayload = (file: File) => ({
  filename: file.name,
  content_type: file.type || 'application/octet-stream',
});

const initialUploadState: ComicUploadState = {
  stage: 'idle',
  uploadedFiles: 0,
  totalFiles: 0,
};

export const useCreateComicMutation = () => {
  const { messageApi } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();
  const [uploadState, setUploadState] = useState<ComicUploadState>(initialUploadState);

  const mutation = useMutation({
    mutationFn: async (payload: CreateComicPayload): Promise<ComicConfirmResponse> => {
      setUploadState({
        stage: 'config',
        uploadedFiles: 0,
        totalFiles: payload.chapters.reduce((total, chapter) => total + chapter.pages.length, 2),
      });

      const uploadPayload: ComicUploadConfigPayload = {
        genreId: payload.genreId,
        title: payload.title,
        description: payload.description,
        tagIds: payload.tagIds,
        cover: getFilePayload(payload.cover.file),
        banner: getFilePayload(payload.banner.file),
        chapters: payload.chapters.map((chapter) => ({
          title: chapter.title,
          description: chapter.description,
          chapter_number: chapter.chapterNumber,
          pages: chapter.pages.map(({ file }) => getFilePayload(file)),
        })),
      };

      const uploadConfigResponse = await api.getComicUploadConfig(uploadPayload);
      const uploadConfig = uploadConfigResponse.data.data;

      const uploadEntries = [
        {
          file: payload.cover.file,
          uploadUrl: uploadConfig.cover.upload_url,
        },
        {
          file: payload.banner.file,
          uploadUrl: uploadConfig.banner.upload_url,
        },
        ...uploadConfig.chapters.flatMap((chapterUpload) => {
          const chapter = payload.chapters.find((item) => item.chapterNumber === chapterUpload.chapter_number);

          if (!chapter) {
            throw new Error(`Не удалось сопоставить главу ${chapterUpload.chapter_number} с конфигом загрузки.`);
          }

          return chapterUpload.pages.map((pageUpload, pageIndex) => {
            const page = chapter.pages[pageIndex];

            if (!page) {
              throw new Error(`Не удалось найти страницу ${pageIndex + 1} для главы ${chapterUpload.chapter_number}.`);
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
      });

      return confirmResponse.data.data;
    },
    onError: (error: Error) => {
      setUploadState(initialUploadState);
      messageApi.error(error.message || 'Не удалось создать комикс.');
    },
    onSuccess: () => {
      setUploadState(initialUploadState);
      queryClient.invalidateQueries([CURRENT_USER_QUERY_KEY]);
    },
  });

  return {
    mutation,
    uploadState,
  };
};
