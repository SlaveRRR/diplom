import { useBlogCreateStore } from './useBlogCreateStore';

describe('useBlogCreateStore', () => {
  let revokeObjectUrlSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    useBlogCreateStore.getState().reset();
    revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    revokeObjectUrlSpy.mockRestore();
  });

  test('заменяет превью обложки и освобождает предыдущую blob-ссылку', () => {
    const firstFile = new File(['cover-1'], 'cover-1.png', { type: 'image/png' });
    const secondFile = new File(['cover-2'], 'cover-2.png', { type: 'image/png' });

    useBlogCreateStore.getState().setCoverFile(firstFile, 'blob:first-cover');
    useBlogCreateStore.getState().setCoverFile(secondFile, 'blob:second-cover');

    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:first-cover');
    expect(useBlogCreateStore.getState().coverFile).toBe(secondFile);
    expect(useBlogCreateStore.getState().coverPreviewUrl).toBe('blob:second-cover');
  });

  test('гидратация очищает встроенные изображения и переводит стор в режим редактирования', () => {
    const inlineFile = new File(['inline'], 'inline.png', { type: 'image/png' });

    useBlogCreateStore.getState().setCoverFile(new File(['cover'], 'cover.png', { type: 'image/png' }), 'blob:cover');
    useBlogCreateStore.getState().registerInlineImage('inline-1', inlineFile, 'blob:inline-1');

    useBlogCreateStore.getState().hydrate({
      postId: 42,
      title: 'Updated post',
      ageRating: '18+',
      tagIds: [1, 3],
      coverPreviewUrl: 'https://cdn.example.com/cover.png',
    });

    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:cover');
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:inline-1');
    expect(useBlogCreateStore.getState()).toMatchObject({
      editingPostId: 42,
      title: 'Updated post',
      ageRating: '18+',
      tagIds: [1, 3],
      coverFile: null,
      coverPreviewUrl: 'https://cdn.example.com/cover.png',
      inlineImages: {},
    });
  });

  test('сброс очищает состояние и освобождает сохраненные object-ссылки', () => {
    useBlogCreateStore
      .getState()
      .setCoverFile(new File(['cover'], 'cover.png', { type: 'image/png' }), 'blob:cover-preview');
    useBlogCreateStore
      .getState()
      .registerInlineImage(
        'inline-1',
        new File(['inline'], 'inline.png', { type: 'image/png' }),
        'blob:inline-preview',
      );

    useBlogCreateStore.getState().reset();

    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:cover-preview');
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:inline-preview');
    expect(useBlogCreateStore.getState()).toMatchObject({
      editingPostId: null,
      title: '',
      ageRating: '16+',
      tagIds: [],
      coverFile: null,
      coverPreviewUrl: '',
      inlineImages: {},
    });
  });
});
