import { render, screen } from '@testing-library/react';

import { Account } from './Account';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useOutletContext: () => ({
    messageApi: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
}));

vi.mock('@components/Profile/hooks/useUpdateCurrentProfileMutation', () => ({
  useUpdateCurrentProfileMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('./hooks', () => ({
  useAccountQuery: () => ({
    data: {
      id: 1,
      role: 'author',
      username: 'moon_author',
      email: 'author@example.com',
      name: 'Moon',
      surname: 'Author',
      avatar: null,
      publicProfilePath: '/profile/moon_author',
      followersCount: 10,
      followingCount: 3,
      comics: [
        {
          id: 11,
          title: 'Лунная башня',
          description: 'Описание комикса',
          status: 'published',
          isHidden: false,
          ageRating: '16+',
          genre: 'Фэнтези',
          tags: ['магия'],
          likesCount: 12,
          commentsCount: 3,
          readersCount: 44,
          chaptersCount: 2,
          publishedAt: '2026-05-01T10:00:00Z',
          updatedAt: '2026-05-01T10:00:00Z',
          cover: '',
          coverUrl: '',
        },
        {
          id: 12,
          title: 'Черновик башни',
          description: 'Пока в работе',
          status: 'draft',
          isHidden: false,
          ageRating: '12+',
          genre: 'Драма',
          tags: ['черновик'],
          likesCount: 0,
          commentsCount: 0,
          readersCount: 0,
          chaptersCount: 1,
          publishedAt: null,
          updatedAt: '2026-05-03T10:00:00Z',
          cover: '',
          coverUrl: '',
        },
        {
          id: 13,
          title: 'Башня на доработке',
          description: 'Нужно поправить главы',
          status: 'revision',
          isHidden: false,
          ageRating: '12+',
          genre: 'Драма',
          tags: ['доработка'],
          likesCount: 1,
          commentsCount: 0,
          readersCount: 2,
          chaptersCount: 1,
          publishedAt: null,
          updatedAt: '2026-05-04T10:00:00Z',
          cover: '',
          coverUrl: '',
        },
      ],
      posts: [
        {
          id: 5,
          title: 'Разбор главы',
          excerpt: 'Короткий текст',
          status: 'published',
          isHidden: false,
          tags: ['редактура'],
          commentsCount: 2,
          publishedAt: '2026-05-02T10:00:00Z',
          updatedAt: '2026-05-02T10:00:00Z',
          cover: '',
          coverUrl: '',
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useAccountAvatarUploadMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
  useAccountContentVisibilityMutation: () => ({
    isLoading: false,
    variables: undefined,
    mutateAsync: vi.fn(),
  }),
  useAccountDraftDeleteMutation: () => ({
    isLoading: false,
    variables: undefined,
    mutateAsync: vi.fn(),
  }),
  useLogoutMutation: () => ({
    isLoading: false,
    mutate: vi.fn(),
  }),
}));

describe('Account', () => {
  test('отображает данные профиля автора, список комиксов и список постов', () => {
    render(<Account />);

    expect(screen.getByText('@moon_author')).toBeInTheDocument();
    expect(screen.getByText('Личные данные')).toBeInTheDocument();
    expect(screen.getByText('Мои комиксы')).toBeInTheDocument();
    expect(screen.getByText('Лунная башня')).toBeInTheDocument();
    expect(screen.getByText('Мои посты')).toBeInTheDocument();
    expect(screen.getByText('Разбор главы')).toBeInTheDocument();
  });

  test('показывает ссылки на редактирование черновика комикса и комикса на доработке', () => {
    render(<Account />);

    const editLinks = screen.getAllByRole('link', { name: 'Продолжить редактирование' });

    expect(editLinks.map((link) => link.getAttribute('href'))).toEqual(['/comics/12/edit', '/comics/13/edit']);
  });
});
