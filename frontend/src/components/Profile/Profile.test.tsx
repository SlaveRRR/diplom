import { render, screen } from '@testing-library/react';

import { Profile } from './Profile';

vi.mock('@ant-design/icons', () => ({
  BookOutlined: () => <span data-testid="icon-book" />,
  CommentOutlined: () => <span data-testid="icon-comment" />,
  EyeOutlined: () => <span data-testid="icon-eye" />,
  HeartOutlined: () => <span data-testid="icon-heart" />,
  LinkOutlined: () => <span data-testid="icon-link" />,
  UserAddOutlined: () => <span data-testid="icon-user-add" />,
  UserDeleteOutlined: () => <span data-testid="icon-user-delete" />,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useOutletContext: () => ({
    messageApi: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
  useParams: () => ({ userId: '25' }),
  useNavigate: () => () => '',
  useLocation: () => {},
}));

vi.mock('@hooks', () => ({
  useApp: () => ({ isAuth: true }),
  useRequireAuthAction: () => ({ redirectToAuth: vi.fn() }),
}));

vi.mock('./hooks', () => ({
  useUserProfileQuery: () => ({
    data: {
      username: 'storyteller',
      role: 'author',
      avatar: null,
      name: 'Ирина',
      surname: 'Север',
      followersCount: 18,
      followingCount: 5,
      isCurrentUser: false,
      isFollowing: true,
      comics: [
        {
          id: 10,
          title: 'Северный ветер',
          description: 'История о городе на краю зимы.',
          ageRating: '16+',
          genre: 'Драма',
          tags: ['зима'],
          likesCount: 11,
          commentsCount: 4,
          readersCount: 70,
          chaptersCount: 3,
          publishedAt: '2026-05-01T10:00:00Z',
          updatedAt: '2026-05-01T10:00:00Z',
          cover: '/cover.jpg',
          coverUrl: '',
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useToggleUserFollowMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
}));

describe('Profile', () => {
  test('отображает публичный профиль автора и опубликованные комиксы', () => {
    render(<Profile />);

    expect(screen.getByText('@storyteller')).toBeInTheDocument();
    expect(screen.getByText('Публичный профиль автора')).toBeInTheDocument();
    expect(screen.getByText('Опубликованные комиксы')).toBeInTheDocument();
    expect(screen.getByText('Северный ветер')).toBeInTheDocument();
    expect(screen.getByText('Отписаться')).toBeInTheDocument();
  });
});
