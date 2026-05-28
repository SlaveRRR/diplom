import { render, screen } from '@testing-library/react';

import { BlogPost } from './BlogPost';

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div>editor-content</div>,
  useEditor: () => null,
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: {},
}));

vi.mock('@components/BlogCreate/editor/blogImageExtension', () => ({
  BlogImage: {},
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useOutletContext: () => ({
    messageApi: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
  useParams: () => ({ postId: '4' }),
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock('@hooks', () => ({
  useApp: () => ({ isAuth: false }),
  useRequireAuthAction: () => ({ redirectToAuth: vi.fn() }),
}));

vi.mock('./hooks', () => ({
  useBlogPostQuery: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
  }),
  useBlogCommentMutation: () => ({
    isLoading: false,
    mutateAsync: vi.fn(),
  }),
}));

describe('BlogPost', () => {
  test('показывает пустое состояние, если пост недоступен', () => {
    render(<BlogPost />);

    expect(screen.getByText('Пост не найден или пока недоступен.')).toBeInTheDocument();
  });
});
