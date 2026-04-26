import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { BlogPostConfirmPayload, BlogPostUploadConfigPayload } from '@types';
import { ACCOUNT_QUERY_KEY } from '@components/Account/hooks/useAccountQuery';
import { BLOG_POSTS_QUERY_KEY } from '@components/Blog/hooks';

type CreateBlogPostMutationPayload = {
  postId?: number | null;
  title: string;
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

  return useMutation({
    mutationFn: async ({
      content,
      coverFile,
      inlineImages,
      postId,
      status,
      tagIds,
      title,
    }: CreateBlogPostMutationPayload) => {
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

      const uploadConfigResponse = await api.getBlogPostUploadConfig(uploadConfigPayload);
      const uploadConfig = uploadConfigResponse.data.data;

      if (coverFile && uploadConfig.cover) {
        await api.uploadFile(uploadConfig.cover.upload_url, coverFile);
      }

      await Promise.all(
        uploadConfig.inlineImages.map((uploadTarget) => {
          const file = inlineImages[uploadTarget.uploadId];

          if (!file) {
            throw new Error('Не найден файл для одной из картинок статьи.');
          }

          return api.uploadFile(uploadTarget.upload_url, file);
        }),
      );

      const replacementMap = Object.fromEntries(uploadConfig.inlineImages.map((item) => [item.uploadId, item.key]));
      const finalContent = replaceImageSources(content, replacementMap) as Record<string, unknown>;

      const confirmResponse = await api.confirmBlogPost({
        postId,
        postDraftId: uploadConfig.postDraftId,
        title,
        tagIds,
        status,
        content: finalContent,
      });

      return confirmResponse.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([BLOG_POSTS_QUERY_KEY]);
      queryClient.invalidateQueries([ACCOUNT_QUERY_KEY]);
    },
  });
};
