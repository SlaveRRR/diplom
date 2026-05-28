import { render, screen } from '@testing-library/react';

import { Account } from './Account';

vi.mock('@ant-design/icons', () => ({
  BookOutlined: () => <span data-testid="icon-book" />,
  CameraOutlined: () => <span data-testid="icon-camera" />,
  CommentOutlined: () => <span data-testid="icon-comment" />,
  EditOutlined: () => <span data-testid="icon-edit" />,
  EyeOutlined: () => <span data-testid="icon-eye" />,
  FileTextOutlined: () => <span data-testid="icon-file-text" />,
  HeartOutlined: () => <span data-testid="icon-heart" />,
  LinkOutlined: () => <span data-testid="icon-link" />,
  LogoutOutlined: () => <span data-testid="icon-logout" />,
  SaveOutlined: () => <span data-testid="icon-save" />,
}));

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
      ],
      posts: [
        {
          id: 5,
          title: 'Разбор главы',
          excerpt: 'Короткий текст',
          status: 'published',
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
});
