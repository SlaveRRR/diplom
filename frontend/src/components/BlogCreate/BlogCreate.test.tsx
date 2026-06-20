import { render, screen } from '@testing-library/react';

import { BlogCreate } from './BlogCreate';

const navigateMock = vi.fn();
const successMock = vi.fn();
const errorMock = vi.fn();

vi.mock('@ant-design/icons', () => ({
  AlignCenterOutlined: () => <span data-testid="icon-align-center" />,
  AlignLeftOutlined: () => <span data-testid="icon-align-left" />,
  AlignRightOutlined: () => <span data-testid="icon-align-right" />,
  BoldOutlined: () => <span data-testid="icon-bold" />,
  FileWordOutlined: () => <span data-testid="icon-docx" />,
  HighlightOutlined: () => <span data-testid="icon-highlight" />,
  ItalicOutlined: () => <span data-testid="icon-italic" />,
  OrderedListOutlined: () => <span data-testid="icon-ordered-list" />,
  PictureOutlined: () => <span data-testid="icon-picture" />,
  PlusOutlined: () => <span data-testid="icon-plus" />,
  RedoOutlined: () => <span data-testid="icon-redo" />,
  SaveOutlined: () => <span data-testid="icon-save" />,
  UndoOutlined: () => <span data-testid="icon-undo" />,
  UnorderedListOutlined: () => <span data-testid="icon-unordered-list" />,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useOutletContext: () => ({
    messageApi: {
      success: successMock,
      error: errorMock,
    },
  }),
  useParams: () => ({}),
  Link: () => <></>,
}));
vi.mock('mammoth', () => ({
  default: {
    convertToHtml: vi.fn(),
    images: {
      imgElement: vi.fn(),
    },
  },
}));

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div data-testid="editor-content" />,
  useEditor: () => ({
    commands: {
      setContent: vi.fn(),
      clearContent: vi.fn(),
    },
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: vi.fn(() => true) }),
        toggleItalic: () => ({ run: vi.fn(() => true) }),
        toggleBulletList: () => ({ run: vi.fn(() => true) }),
        toggleOrderedList: () => ({ run: vi.fn(() => true) }),
        undo: () => ({ run: vi.fn(() => true) }),
        redo: () => ({ run: vi.fn(() => true) }),
        setHeading: () => ({ run: vi.fn(() => true) }),
        toggleBlockquote: () => ({ run: vi.fn(() => true) }),
        setParagraph: () => ({ run: vi.fn(() => true) }),
        insertContent: () => ({ run: vi.fn(() => true) }),
      }),
    }),
    getJSON: vi.fn(() => ({ type: 'doc', content: [] })),
    isActive: vi.fn(() => false),
  }),
  useEditorState: () => ({
    isBold: false,
    isItalic: false,
    isBulletList: false,
    isOrderedList: false,
    isBlockquote: false,
    isHeading2: false,
    isHeading3: false,
  }),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('./editor/blogImageExtension', () => ({
  BlogImage: {},
}));

vi.mock('@hooks', () => ({
  usePlatformTaxonomy: () => ({
    data: {
      ageRatings: [{ label: '16+', value: '16+' }],
    },
    isLoading: false,
  }),
}));

vi.mock('@components/Blog/hooks', () => ({
  useBlogTagsQuery: () => ({
    data: [{ id: 1, name: 'Новости' }],
    isLoading: false,
  }),
}));

vi.mock('@components/shared', () => ({
  Select: ({ placeholder }: { placeholder?: string }) => <div>{placeholder}</div>,
}));

vi.mock('./hooks', () => ({
  useBlogCreateStore: () => ({
    ageRating: '16+',
    editingPostId: null,
    coverFile: null,
    coverPreviewUrl: '',
    hydrate: vi.fn(),
    inlineImages: {},
    registerInlineImage: vi.fn(),
    reset: vi.fn(),
    setAgeRating: vi.fn(),
    setCoverFile: vi.fn(),
    setTagIds: vi.fn(),
    setTitle: vi.fn(),
    tagIds: [],
    title: '',
  }),
  useCreateBlogPostMutation: () => ({
    mutation: {
      isLoading: false,
      mutateAsync: vi.fn(),
    },
    uploadState: {
      stage: 'idle',
      uploadedFiles: 0,
      totalFiles: 0,
      isDraftLocked: false,
      lockedDraftId: null,
      errorMessage: null,
    },
    clearUploadLock: vi.fn(),
  }),
  useEditableBlogPostQuery: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

describe('BlogCreate', () => {
  test('отображает стартовый экран создания поста', () => {
    render(<BlogCreate />);

    expect(screen.getByText('Сохранить как черновик')).toBeInTheDocument();
    expect(screen.getByText('Отправить на модерацию')).toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });
});
