import { QueryClientProvider } from '@test-utils';
import { renderHook, waitFor } from '@testing-library/react';

import { api } from '@api';

import { usePlatformTaxonomy } from './usePlatformTaxonomy';

vi.mock('@api', () => ({
  api: {
    getPlatformTaxonomy: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

describe('usePlatformTaxonomy', () => {
  test('мапит taxonomy в select options', async () => {
    mockApi.getPlatformTaxonomy.mockResolvedValue({
      data: {
        data: {
          genres: [{ id: 1, name: 'Фэнтези', description: 'Миры и магия' }],
          tags: [{ id: 11, name: 'Приключение', description: 'Движение сюжета' }],
          ageRatings: [{ value: '16+', label: '16+', description: 'Для подростков' }],
        },
      },
    } as never);

    const { result } = renderHook(() => usePlatformTaxonomy(), {
      wrapper: QueryClientProvider,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      genres: [{ value: 1, label: 'Фэнтези', description: 'Миры и магия' }],
      tags: [{ value: 11, label: 'Приключение', description: 'Движение сюжета' }],
      ageRatings: [{ value: '16+', label: '16+', description: 'Для подростков' }],
    });
  });
});
