import { render, screen } from '@testing-library/react';

import { Blog } from './Blog';

const mockGuardNavigation = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({
    children,
    to,
    onClick,
  }: {
    children: React.ReactNode;
    to: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock('@hooks', () => ({
  useApp: () => ({ isAuth: true }),
  useAdultContentGate: () => ({
    guardNavigation: mockGuardNavigation,
    adultContentModal: <div data-testid="adult-modal" />,
    isAdultContentConfirmed: true,
  }),
  useWindowSize: () => ({ size: '' }),
}));

vi.mock('@components/shared', () => ({
  Select: ({ placeholder }: { placeholder?: string }) => <div>{placeholder}</div>,
}));

vi.mock('./hooks', () => ({
  useBlogPostsQuery: () => ({
    data: {
      items: [
        {
          id: 7,
          title: 'Разбор структуры сюжета',
          excerpt: 'Как выстраивать главы и ритм публикации.',
          ageRating: '16+',
          cover: '/cover.jpg',
          coverUrl: '',
          commentsCount: 12,
          publishedAt: '2026-05-01T10:00:00Z',
          author: { username: 'author' },
          tags: [{ id: 1, name: 'редактура' }],
        },
      ],
      pagination: {
        page: 1,
        pageSize: 9,
        total: 1,
        totalPages: 1,
      },
    },
    isLoading: false,
  }),
  useBlogTagsQuery: () => ({
    data: [{ id: 1, name: 'редактура' }],
    isLoading: false,
  }),
}));

describe('Blog', () => {
  test('отображает посты блога и кнопку создания поста для авторизованного пользователя', () => {
    render(<Blog />);

    expect(screen.getByText('Блог')).toBeInTheDocument();
    expect(screen.getByText('Написать пост')).toBeInTheDocument();
    expect(screen.getByText('Разбор структуры сюжета')).toBeInTheDocument();
    expect(screen.getByTestId('adult-modal')).toBeInTheDocument();
  });
});
