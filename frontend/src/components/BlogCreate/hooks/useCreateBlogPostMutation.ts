import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { BlogPostConfirmPayload, BlogPostUploadConfigPayload, BlogPostUploadConfigResponse } from '@types';
import { ACCOUNT_QUERY_KEY } from '@components/Account/hooks/useAccountQuery';
import { BLOG_POSTS_QUERY_KEY } from '@components/Blog/hooks';

type CreateBlogPostMutationPayload = {
  postId?: number | null;
  title: string;
  ageRating: string;
  tagIds: number[];
  content: Record<string, unknown>;
  coverFile: File | null;
  inlineImages: Record<string, File>;
  status: BlogPostConfirmPayload['status'];
};

type UploadConfigInlineImage = {
  uploadId: string;
  filename: string;
  content_type: string;
};

type ReplaceMap = Record<string, string>;

type BlogUploadState = {
  stage: 'idle' | 'config' | 'upload' | 'confirm';
  uploadedFiles: number;
  totalFiles: number;
  isDraftLocked: boolean;
  lockedDraftId: number | null;
  errorMessage: string | null;
};

type PendingBlogUpload = {
  signature: string;
  uploadConfig: BlogPostUploadConfigResponse;
  uploadedKeys: Set<string>;
};

const initialUploadState: BlogUploadState = {
  stage: 'idle',
  uploadedFiles: 0,
  totalFiles: 0,
  isDraftLocked: false,
  lockedDraftId: null,
  errorMessage: null,
};

const getFileSignature = (file: File | null | undefined) =>
  file ? `${file.name}:${file.size}:${file.type}:${file.lastModified}` : null;

const buildUploadSignature = (
  payload: Pick<CreateBlogPostMutationPayload, 'coverFile' | 'inlineImages' | 'postId'>,
  usedInlineImageIds: Set<string>,
) =>
  JSON.stringify({
    postId: payload.postId ?? null,
    cover: getFileSignature(payload.coverFile),
    inlineImages: Array.from(usedInlineImageIds)
      .sort()
      .map((uploadId) => ({
        uploadId,
        file: getFileSignature(payload.inlineImages[uploadId]),
      })),
  });

const replaceImageSources = (value: unknown, replacements: ReplaceMap): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => replaceImageSources(item, replacements));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const nextValue = { ...(value as Record<string, unknown>) };
  const attrs = nextValue.attrs as Record<string, unknown> | undefined;
  const uploadId = typeof attrs?.uploadId === 'string' ? attrs.uploadId : undefined;

  if (nextValue.type === 'image' && uploadId && replacements[uploadId]) {
    nextValue.attrs = {
      ...attrs,
      src: replacements[uploadId],
      storageKey: replacements[uploadId],
    };
  }

  Object.keys(nextValue).forEach((key) => {
    nextValue[key] = replaceImageSources(nextValue[key], replacements);
  });

  return nextValue;
};

const collectInlineImageIds = (value: unknown, ids: Set<string>) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectInlineImageIds(item, ids));
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  const node = value as Record<string, unknown>;
  const attrs = node.attrs as Record<string, unknown> | undefined;

  if (node.type === 'image' && typeof attrs?.uploadId === 'string') {
    ids.add(attrs.uploadId);
  }

  Object.values(node).forEach((item) => collectInlineImageIds(item, ids));
};

export const useCreateBlogPostMutation = () => {
  const queryClient = useQueryClient();
  const [uploadState, setUploadState] = useState<BlogUploadState>(initialUploadState);
  const lockedDraftIdRef = useRef<number | null>(null);
  const pendingUploadRef = useRef<PendingBlogUpload | null>(null);

  const clearUploadLock = () => {
    lockedDraftIdRef.current = null;
    pendingUploadRef.current = null;
    setUploadState(initialUploadState);
  };

  const mutation = useMutation({
    mutationFn: async ({
      ageRating,
      content,
      coverFile,
      inlineImages,
      postId,
      status,
      tagIds,
      title,
    }: CreateBlogPostMutationPayload) => {
      lockedDraftIdRef.current = null;

      if (lockedDraftIdRef.current) {
        throw new Error(
          'Предыдущая загрузка завершилась ошибкой после создания upload-config. Сбросьте форму, чтобы начать заново.',
        );
      }

      const usedInlineImageIds = new Set<string>();
      collectInlineImageIds(content, usedInlineImageIds);

      const uploadConfigPayload: BlogPostUploadConfigPayload = {
        inlineImages: Array.from(usedInlineImageIds).reduce<UploadConfigInlineImage[]>((accumulator, uploadId) => {
          const file = inlineImages[uploadId];

          if (!file) {
            return accumulator;
          }

          accumulator.push({
            uploadId,
            filename: file.name,
            content_type: file.type || 'application/octet-stream',
          });

          return accumulator;
        }, []),
      };

      if (coverFile) {
        uploadConfigPayload.cover = {
          filename: coverFile.name,
          content_type: coverFile.type || 'application/octet-stream',
        };
      }

      setUploadState({
        stage: 'config',
        uploadedFiles: 0,
        totalFiles: usedInlineImageIds.size + (coverFile ? 1 : 0),
        isDraftLocked: false,
        lockedDraftId: null,
        errorMessage: null,
      });

      let createdDraftId: number | null = null;
      const uploadSignature = buildUploadSignature({ coverFile, inlineImages, postId }, usedInlineImageIds);

      try {
        const reusableUpload =
          pendingUploadRef.current?.signature === uploadSignature ? pendingUploadRef.current : null;
        const uploadConfig = reusableUpload
          ? reusableUpload.uploadConfig
          : (await api.getBlogPostUploadConfig(uploadConfigPayload)).data.data;

        if (!reusableUpload) {
          pendingUploadRef.current = {
            signature: uploadSignature,
            uploadConfig,
            uploadedKeys: new Set(),
          };
        }

        createdDraftId = uploadConfig.postDraftId;
        lockedDraftIdRef.current = createdDraftId;

        const uploadEntries = [
          ...(coverFile && uploadConfig.cover
            ? [{ file: coverFile, key: uploadConfig.cover.key, uploadUrl: uploadConfig.cover.upload_url }]
            : []),
          ...uploadConfig.inlineImages.map((uploadTarget) => {
            const file = inlineImages[uploadTarget.uploadId];

            if (!file) {
              throw new Error('Не найден файл для одной из картинок статьи.');
            }

            return {
              file,
              key: uploadTarget.key,
              uploadUrl: uploadTarget.upload_url,
            };
          }),
        ];

        const uploadedKeys = pendingUploadRef.current?.uploadedKeys ?? new Set<string>();
        const alreadyUploadedFiles = uploadEntries.filter((entry) => uploadedKeys.has(entry.key)).length;

        setUploadState((prevState) => ({
          ...prevState,
          stage: 'upload',
          uploadedFiles: alreadyUploadedFiles,
          totalFiles: uploadEntries.length,
          lockedDraftId: createdDraftId,
          isDraftLocked: false,
          errorMessage: null,
        }));

        for (const uploadEntry of uploadEntries) {
          if (uploadedKeys.has(uploadEntry.key)) {
            continue;
          }

          await api.uploadFile(uploadEntry.uploadUrl, uploadEntry.file);
          uploadedKeys.add(uploadEntry.key);

          setUploadState((prevState) => ({
            ...prevState,
            uploadedFiles: prevState.uploadedFiles + 1,
          }));
        }

        const replacementMap = Object.fromEntries(uploadConfig.inlineImages.map((item) => [item.uploadId, item.key]));
        const finalContent = replaceImageSources(content, replacementMap) as Record<string, unknown>;

        setUploadState((prevState) => ({
          ...prevState,
          stage: 'confirm',
        }));

        const confirmResponse = await api.confirmBlogPost({
          postId,
          postDraftId: uploadConfig.postDraftId,
          title,
          ageRating,
          tagIds,
          status,
          content: finalContent,
        });

        return confirmResponse.data.data;
      } catch (error) {
        const message =
          error instanceof Error && error.message ? error.message : 'Не удалось завершить создание поста.';

        if (createdDraftId) {
          setUploadState({
            stage: 'idle',
            uploadedFiles: pendingUploadRef.current?.uploadedKeys.size ?? 0,
            totalFiles: usedInlineImageIds.size + (coverFile ? 1 : 0),
            isDraftLocked: false,
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
    onSuccess: () => {
      lockedDraftIdRef.current = null;
      pendingUploadRef.current = null;
      setUploadState(initialUploadState);
      queryClient.invalidateQueries([BLOG_POSTS_QUERY_KEY]);
      queryClient.invalidateQueries([ACCOUNT_QUERY_KEY]);
    },
  });

  return {
    mutation,
    uploadState,
    clearUploadLock,
  };
};
