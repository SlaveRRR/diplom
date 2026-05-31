import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { api } from '@api';

import { useCreateBlogPostMutation } from './useCreateBlogPostMutation';

vi.mock('@api', () => ({
  api: {
    getBlogPostUploadConfig: vi.fn(),
    uploadFile: vi.fn(),
    confirmBlogPost: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return {
    queryClient,
    wrapper,
  };
};

const mockApi = vi.mocked(api);

describe('useCreateBlogPostMutation', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('загружает используемые файлы, переписывает ссылки встроенных изображений и подтверждает пост', async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const coverFile = new File(['cover'], 'cover.png', { type: 'image/png' });
    const usedInlineFile = new File(['inline-used'], 'inline-used.png', { type: 'image/png' });
    const unusedInlineFile = new File(['inline-unused'], 'inline-unused.png', { type: 'image/png' });

    mockApi.getBlogPostUploadConfig.mockResolvedValue({
      data: {
        data: {
          postDraftId: 9,
          expiresAt: '2026-05-07T10:00:00Z',
          cover: {
            method: 'PUT',
            key: 'posts/covers/cover.png',
            upload_url: 'https://upload.example.com/cover',
          },
          inlineImages: [
            {
              uploadId: 'inline-1',
              method: 'PUT',
              key: 'posts/images/inline-1.png',
              upload_url: 'https://upload.example.com/inline-1',
            },
          ],
        },
      },
    } as never);

    mockApi.uploadFile.mockResolvedValue({} as never);
    mockApi.confirmBlogPost.mockResolvedValue({
      data: {
        data: {
          id: 55,
          title: 'New post',
          coverUrl: 'https://cdn.example.com/cover.png',
          ageRating: '16+',
          status: 'draft',
        },
      },
    } as never);

    const { result } = renderHook(() => useCreateBlogPostMutation(), {
      wrapper,
    });

    const content = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            uploadId: 'inline-1',
            src: 'blob:inline-1',
          },
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Body',
            },
          ],
        },
      ],
    };

    await act(async () => {
      await result.current.mutation.mutateAsync({
        title: 'New post',
        ageRating: '16+',
        tagIds: [2, 5],
        content,
        coverFile,
        inlineImages: {
          'inline-1': usedInlineFile,
          'inline-unused': unusedInlineFile,
        },
        status: 'draft',
      });
    });

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));

    expect(mockApi.getBlogPostUploadConfig).toHaveBeenCalledWith({
      cover: {
        filename: 'cover.png',
        content_type: 'image/png',
      },
      inlineImages: [
        {
          uploadId: 'inline-1',
          filename: 'inline-used.png',
          content_type: 'image/png',
        },
      ],
    });

    expect(mockApi.uploadFile).toHaveBeenCalledTimes(2);
    expect(mockApi.uploadFile).toHaveBeenNthCalledWith(1, 'https://upload.example.com/cover', coverFile);
    expect(mockApi.uploadFile).toHaveBeenNthCalledWith(2, 'https://upload.example.com/inline-1', usedInlineFile);

    expect(mockApi.confirmBlogPost).toHaveBeenCalledWith({
      postId: undefined,
      postDraftId: 9,
      title: 'New post',
      ageRating: '16+',
      tagIds: [2, 5],
      status: 'draft',
      content: {
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: {
              uploadId: 'inline-1',
              src: 'posts/images/inline-1.png',
              storageKey: 'posts/images/inline-1.png',
            },
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Body',
              },
            ],
          },
        ],
      },
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith(['blog-posts']);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith(['account']);
  });

  test('завершается ошибкой, если конфигурация загрузки ссылается на отсутствующий встроенный файл', async () => {
    const { wrapper } = createWrapper();

    mockApi.getBlogPostUploadConfig.mockResolvedValue({
      data: {
        data: {
          postDraftId: 1,
          expiresAt: '2026-05-07T10:00:00Z',
          cover: null,
          inlineImages: [
            {
              uploadId: 'inline-missing',
              method: 'PUT',
              key: 'posts/images/missing.png',
              upload_url: 'https://upload.example.com/missing',
            },
          ],
        },
      },
    } as never);

    const { result } = renderHook(() => useCreateBlogPostMutation(), {
      wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutation.mutateAsync({
          title: 'Draft',
          ageRating: '16+',
          tagIds: [1],
          status: 'under_review',
          coverFile: null,
          inlineImages: {},
          content: {
            type: 'doc',
            content: [
              {
                type: 'image',
                attrs: {
                  uploadId: 'inline-missing',
                },
              },
            ],
          },
        });
      } catch {
        /* noop */
      }
    });

    await waitFor(() => expect(result.current.mutation.isError).toBe(true));
    expect(mockApi.confirmBlogPost).not.toHaveBeenCalled();
  });

  test('блокирует повторный запуск после ошибки загрузки в S3 до ручного сброса', async () => {
    const { wrapper } = createWrapper();
    const coverFile = new File(['cover'], 'cover.webp', { type: 'image/webp' });

    mockApi.getBlogPostUploadConfig.mockResolvedValue({
      data: {
        data: {
          postDraftId: 77,
          expiresAt: '2026-05-07T10:00:00Z',
          cover: {
            method: 'PUT',
            key: 'posts/covers/cover.webp',
            upload_url: 'https://upload.example.com/cover',
          },
          inlineImages: [],
        },
      },
    } as never);
    mockApi.uploadFile.mockRejectedValue(new Error('Ошибка загрузки в S3'));

    const { result } = renderHook(() => useCreateBlogPostMutation(), {
      wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutation.mutateAsync({
          title: 'Draft',
          ageRating: '16+',
          tagIds: [],
          status: 'draft',
          coverFile,
          inlineImages: {},
          content: { type: 'doc', content: [] },
        });
      } catch {
        /* noop */
      }
    });

    await waitFor(() => expect(result.current.uploadState.isDraftLocked).toBe(true));
    expect(result.current.uploadState.lockedDraftId).toBe(77);

    await act(async () => {
      try {
        await result.current.mutation.mutateAsync({
          title: 'Draft',
          ageRating: '16+',
          tagIds: [],
          status: 'draft',
          coverFile,
          inlineImages: {},
          content: { type: 'doc', content: [] },
        });
      } catch {
        /* noop */
      }
    });

    expect(mockApi.getBlogPostUploadConfig).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.clearUploadLock();
    });

    expect(result.current.uploadState.isDraftLocked).toBe(false);
  });
});
