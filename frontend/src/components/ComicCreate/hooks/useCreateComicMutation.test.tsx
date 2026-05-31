import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { api } from '@api';

import { CreateComicPayload } from '../types';
import { useCreateComicMutation } from './useCreateComicMutation';

const mockMessageError = vi.fn();

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({
    messageApi: {
      error: mockMessageError,
    },
  }),
}));

vi.mock('@api', () => ({
  api: {
    getComicUploadConfig: vi.fn(),
    uploadFile: vi.fn(),
    confirmComicCreation: vi.fn(),
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

  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  return {
    queryClient,
    wrapper,
  };
};

const mockApi = vi.mocked(api);

const createPayload = (): CreateComicPayload => ({
  title: 'Moon Tower',
  description: 'Adventure comic',
  ageRating: '16+',
  tagIds: [2, 4],
  genreId: 7,
  submissionMode: 'under_review',
  cover: {
    id: 'cover',
    fingerprint: 'cover',
    preview: 'blob:cover',
    file: new File(['cover'], 'cover.png', { type: 'image/png' }),
    source: 'new',
  },
  banner: {
    id: 'banner',
    fingerprint: 'banner',
    preview: 'blob:banner',
    file: new File(['banner'], 'banner.png', { type: 'image/png' }),
    source: 'new',
  },
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1',
      description: 'Story begins',
      chapterNumber: 1,
      pages: [
        {
          id: 'page-1',
          fingerprint: 'page-1',
          preview: 'blob:page-1',
          file: new File(['page-1'], 'page-1.png', { type: 'image/png' }),
          source: 'new',
        },
      ],
    },
  ],
});

describe('useCreateComicMutation', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('загружает ресурсы комикса по порядку и подтверждает отправку на модерацию', async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockApi.getComicUploadConfig.mockResolvedValue({
      data: {
        data: {
          comic_draft_id: '77',
          cover: {
            method: 'PUT',
            key: 'comics/covers/cover.png',
            upload_url: 'https://upload.example.com/cover',
          },
          banner: {
            method: 'PUT',
            key: 'comics/banners/banner.png',
            upload_url: 'https://upload.example.com/banner',
          },
          chapters: [
            {
              chapter_draft_id: 'chapter-draft-1',
              chapter_number: 1,
              pages: [
                {
                  page_index: 0,
                  method: 'PUT',
                  key: 'comics/chapters/1/page-1.png',
                  upload_url: 'https://upload.example.com/page-1',
                },
              ],
            },
          ],
        },
      },
    } as never);

    mockApi.uploadFile.mockResolvedValue({} as never);
    mockApi.confirmComicCreation.mockResolvedValue({
      data: {
        data: {
          comic_id: 77,
          id: 77,
          title: 'Moon Tower',
          status: 'under_review',
          chapter_ids: [11],
        },
      },
    } as never);

    const { result } = renderHook(() => useCreateComicMutation(), {
      wrapper,
    });

    const payload = createPayload();

    await act(async () => {
      await result.current.mutation.mutateAsync(payload);
    });

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));

    expect(mockApi.getComicUploadConfig).toHaveBeenCalledTimes(1);
    expect(mockApi.uploadFile).toHaveBeenCalledTimes(3);
    expect(mockApi.uploadFile).toHaveBeenNthCalledWith(1, 'https://upload.example.com/cover', payload.cover.file);
    expect(mockApi.uploadFile).toHaveBeenNthCalledWith(2, 'https://upload.example.com/banner', payload.banner.file);
    expect(mockApi.uploadFile).toHaveBeenNthCalledWith(
      3,
      'https://upload.example.com/page-1',
      payload.chapters[0].pages[0].file,
    );
    expect(mockApi.confirmComicCreation).toHaveBeenCalledWith({
      comic_draft_id: '77',
      submission_mode: 'under_review',
      comic_id: undefined,
    });
    expect(result.current.uploadState).toEqual({
      stage: 'idle',
      uploadedFiles: 0,
      totalFiles: 0,
      isDraftLocked: false,
      lockedDraftId: null,
      errorMessage: null,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith(['current_user']);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith(['account']);
  });

  test('блокирует повторное создание upload-config после ошибки загрузки в s3', async () => {
    const { wrapper } = createWrapper();

    mockApi.getComicUploadConfig.mockResolvedValue({
      data: {
        data: {
          comic_draft_id: '77',
          cover: {
            method: 'PUT',
            key: 'comics/covers/cover.png',
            upload_url: 'https://upload.example.com/cover',
          },
          banner: {
            method: 'PUT',
            key: 'comics/banners/banner.png',
            upload_url: 'https://upload.example.com/banner',
          },
          chapters: [
            {
              chapter_draft_id: 'chapter-draft-1',
              chapter_number: 1,
              pages: [
                {
                  page_index: 0,
                  method: 'PUT',
                  key: 'comics/chapters/1/page-1.png',
                  upload_url: 'https://upload.example.com/page-1',
                },
              ],
            },
          ],
        },
      },
    } as never);

    mockApi.uploadFile.mockRejectedValueOnce(new Error('S3 upload failed'));

    const { result } = renderHook(() => useCreateComicMutation(), {
      wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutation.mutateAsync(createPayload());
      } catch {
        /* noop */
      }
    });

    await waitFor(() => expect(result.current.mutation.isError).toBe(true));

    expect(result.current.uploadState).toEqual({
      stage: 'idle',
      uploadedFiles: 0,
      totalFiles: 0,
      isDraftLocked: true,
      lockedDraftId: '77',
      errorMessage: 'S3 upload failed',
    });

    await act(async () => {
      try {
        await result.current.mutation.mutateAsync(createPayload());
      } catch {
        /* noop */
      }
    });

    expect(mockApi.getComicUploadConfig).toHaveBeenCalledTimes(1);
    expect(mockMessageError).toHaveBeenLastCalledWith(
      'Предыдущая загрузка завершилась ошибкой после создания upload-config. Сбросьте форму, чтобы начать заново.',
    );

    act(() => {
      result.current.clearUploadLock();
    });

    expect(result.current.uploadState).toEqual({
      stage: 'idle',
      uploadedFiles: 0,
      totalFiles: 0,
      isDraftLocked: false,
      lockedDraftId: null,
      errorMessage: null,
    });
  });
});
