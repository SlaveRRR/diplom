import { Alert, Button, Card, Col, Empty, Flex, Input, Row, Tag, Tooltip, Typography, Upload } from 'antd';
import mammoth from 'mammoth';
import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  FileWordOutlined,
  HighlightOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  PictureOutlined,
  PlusOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Editor, EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { colors } from '@constants';
import { usePlatformTaxonomy } from '@hooks';
import {
  getAllowedImageAccept,
  MAX_IMAGE_DIMENSION_PX,
  MAX_IMAGE_UPLOAD_SIZE_MB,
  normalizeUploadImage,
  normalizeUploadImagesSettled,
} from '@utils';
import { useBlogTagsQuery } from '@components/Blog/hooks';
import { Select } from '@components/shared';
import { OutletContext } from '@pages/LayoutPage/types';

import { BlogImage } from './editor/blogImageExtension';
import { Highlight, TextAlign } from './editor/textFormattingExtensions';
import { useBlogCreateStore, useCreateBlogPostMutation, useEditableBlogPostQuery } from './hooks';

const { Text } = Typography;

const createUploadId = () => `blog-image-${crypto.randomUUID()}`;

type ToolbarButton = {
  key: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  action: () => void;
};

type BlockTypeValue = 'paragraph' | 'heading-1' | 'heading-2' | 'heading-3' | 'heading-4' | 'blockquote';
type TextAlignValue = 'left' | 'center' | 'right' | 'justify';

const extendedBlockTypeOptions = [
  { value: 'paragraph', label: 'Обычный текст' },
  { value: 'heading-1', label: 'Заголовок H1' },
  { value: 'heading-2', label: 'Заголовок H2' },
  { value: 'heading-3', label: 'Заголовок H3' },
  { value: 'heading-4', label: 'Заголовок H4' },
  { value: 'blockquote', label: 'Цитата' },
] satisfies Array<{ value: BlockTypeValue; label: string }>;

const textAlignOptions = [
  { value: 'left', label: 'По левому краю', icon: <AlignLeftOutlined /> },
  { value: 'center', label: 'По центру', icon: <AlignCenterOutlined /> },
  { value: 'right', label: 'По правому краю', icon: <AlignRightOutlined /> },
  { value: 'justify', label: 'По ширине', icon: <span className="font-semibold leading-none">J</span> },
] satisfies Array<{ value: TextAlignValue; label: string; icon: ReactNode }>;

const blockTypeOptions = [
  { value: 'paragraph', label: 'Параграф' },
  { value: 'heading-2', label: 'Заголовок H2' },
  { value: 'heading-3', label: 'Заголовок H3' },
  { value: 'blockquote', label: 'Цитата' },
] satisfies Array<{ value: BlockTypeValue; label: string }>;

const legacyBlockTypeOptionsCount = blockTypeOptions.length;
void legacyBlockTypeOptionsCount;

const MODERATION_ALERT = (
  <Alert
    type="info"
    showIcon
    message="Памятка по модерации и размещаемому контенту"
    description={
      <span>
        Перед сохранением и отправкой поста на модерацию проверьте требования к допустимому контенту.{' '}
        <RouterLink to="/content-guidelines">Открыть памятку</RouterLink>
      </span>
    }
  />
);

const IMAGE_REQUIREMENTS_TEXT = `Поддерживаются PNG, JPG и WEBP до ${MAX_IMAGE_UPLOAD_SIZE_MB} МБ и до ${MAX_IMAGE_DIMENSION_PX}px по большей стороне. PNG и JPG автоматически конвертируются в WEBP.`;

const dataUrlToFile = async (src: string, filename: string) => {
  const response = await fetch(src);
  const blob = await response.blob();

  return new File([blob], filename, { type: blob.type || 'image/png' });
};

const runEditorAction = (editor: Editor | null, action: (instance: Editor) => boolean) => {
  if (!editor) {
    return;
  }

  action(editor);
};

export const BlogCreate: FC = () => {
  const { messageApi } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const { postId } = useParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docxInputRef = useRef<HTMLInputElement | null>(null);

  const { data: tags = [], isLoading: isLoadingTags } = useBlogTagsQuery();
  const { data: taxonomy, isLoading: isLoadingTaxonomy } = usePlatformTaxonomy();
  const { data: editablePost, isLoading: isLoadingEditablePost } = useEditableBlogPostQuery(postId);
  const { mutation, uploadState, clearUploadLock } = useCreateBlogPostMutation();
  const {
    ageRating,
    editingPostId,
    coverFile,
    coverPreviewUrl,
    hydrate,
    inlineImages,
    registerInlineImage,
    reset,
    setAgeRating,
    setCoverFile,
    setTagIds,
    setTitle,
    tagIds,
    title,
  } = useBlogCreateStore();
  const [editorJson, setEditorJson] = useState<Record<string, unknown>>({ type: 'doc', content: [] });

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }), TextAlign, Highlight, BlogImage],
    content: editorJson,
    editorProps: {
      attributes: {
        class:
          'min-h-[360px] rounded-[24px] border border-black/8 bg-white px-4 py-4 text-[15px] leading-7 outline-none [&_p]:my-3 [&_h1]:my-5 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h2]:my-4 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h3]:my-3 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-tight [&_h4]:my-3 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:leading-tight [&_mark]:rounded [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-primary)] [&_blockquote]:bg-black/[0.03] [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-4 [&_img]:rounded-2xl',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setEditorJson(currentEditor.getJSON() as Record<string, unknown>);
    },
  });

  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isBold: currentEditor.isActive('bold'),
      isItalic: currentEditor.isActive('italic'),
      isHighlight: currentEditor.isActive('highlight'),
      isBulletList: currentEditor.isActive('bulletList'),
      isOrderedList: currentEditor.isActive('orderedList'),
      isBlockquote: currentEditor.isActive('blockquote'),
      isHeading1: currentEditor.isActive('heading', { level: 1 }),
      isHeading2: currentEditor.isActive('heading', { level: 2 }),
      isHeading3: currentEditor.isActive('heading', { level: 3 }),
      isHeading4: currentEditor.isActive('heading', { level: 4 }),
      textAlign:
        currentEditor.getAttributes('heading').textAlign ||
        currentEditor.getAttributes('paragraph').textAlign ||
        'left',
    }),
  });

  useEffect(() => () => reset(), [reset]);

  useEffect(() => {
    if (!editablePost || !editor) {
      return;
    }

    hydrate({
      postId: editablePost.id,
      title: editablePost.title,
      ageRating: editablePost.ageRating,
      tagIds: editablePost.tagIds,
      coverPreviewUrl: editablePost.coverUrl || '',
    });
    editor.commands.setContent(editablePost.content, { emitUpdate: true });
  }, [editablePost, editor, hydrate]);

  const currentBlockType: BlockTypeValue = useMemo(() => {
    if (editorState?.isBlockquote) {
      return 'blockquote';
    }

    if (editorState?.isHeading1) {
      return 'heading-1';
    }

    if (editorState?.isHeading2) {
      return 'heading-2';
    }

    if (editorState?.isHeading3) {
      return 'heading-3';
    }

    if (editorState?.isHeading4) {
      return 'heading-4';
    }

    return 'paragraph';
  }, [editorState]);

  const formattingButtons = useMemo<ToolbarButton[]>(
    () => [
      {
        key: 'bold',
        label: 'Жирный',
        icon: <BoldOutlined />,
        active: editorState?.isBold,
        action: () => runEditorAction(editor, (instance) => instance.chain().focus().toggleBold().run()),
      },
      {
        key: 'italic',
        label: 'Курсив',
        icon: <ItalicOutlined />,
        active: editorState?.isItalic,
        action: () => runEditorAction(editor, (instance) => instance.chain().focus().toggleItalic().run()),
      },
      {
        key: 'highlight',
        label: 'Выделение',
        icon: <HighlightOutlined />,
        active: editorState?.isHighlight,
        action: () => runEditorAction(editor, (instance) => instance.chain().focus().toggleHighlight().run()),
      },
      {
        key: 'bullet',
        label: 'Маркированный список',
        icon: <UnorderedListOutlined />,
        active: editorState?.isBulletList,
        action: () => runEditorAction(editor, (instance) => instance.chain().focus().toggleBulletList().run()),
      },
      {
        key: 'ordered',
        label: 'Нумерованный список',
        icon: <OrderedListOutlined />,
        active: editorState?.isOrderedList,
        action: () => runEditorAction(editor, (instance) => instance.chain().focus().toggleOrderedList().run()),
      },
      {
        key: 'undo',
        label: 'Отменить',
        icon: <UndoOutlined />,
        action: () => runEditorAction(editor, (instance) => instance.chain().focus().undo().run()),
      },
      {
        key: 'redo',
        label: 'Повторить',
        icon: <RedoOutlined />,
        action: () => runEditorAction(editor, (instance) => instance.chain().focus().redo().run()),
      },
    ],
    [editor, editorState],
  );

  const alignmentButtons = useMemo<ToolbarButton[]>(
    () =>
      textAlignOptions.map((option) => ({
        key: `align-${option.value}`,
        label: option.label,
        icon: option.icon,
        active: editorState?.textAlign === option.value,
        action: () => runEditorAction(editor, (instance) => instance.chain().focus().setTextAlign(option.value).run()),
      })),
    [editor, editorState?.textAlign],
  );

  const handleSelectCover = async (file: File) => {
    try {
      const normalizedFile = await normalizeUploadImage(file);
      const previewUrl = URL.createObjectURL(normalizedFile);

      setCoverFile(normalizedFile, previewUrl);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось обработать изображение обложки.');
    }

    return Upload.LIST_IGNORE;
  };

  const handleBlockTypeChange = (value: string | number) => {
    if (!editor) {
      return;
    }

    const normalizedValue = value as BlockTypeValue;

    switch (normalizedValue) {
      case 'heading-1':
        editor.chain().focus().setHeading({ level: 1 }).run();
        break;
      case 'heading-2':
        editor.chain().focus().setHeading({ level: 2 }).run();
        break;
      case 'heading-3':
        editor.chain().focus().setHeading({ level: 3 }).run();
        break;
      case 'heading-4':
        editor.chain().focus().setHeading({ level: 4 }).run();
        break;
      case 'blockquote':
        if (!editor.isActive('blockquote')) {
          editor.chain().focus().toggleBlockquote().run();
        }
        break;
      case 'paragraph':
      default:
        if (editor.isActive('blockquote')) {
          editor.chain().focus().toggleBlockquote().run();
        }
        editor.chain().focus().setParagraph().run();
        break;
    }
  };

  const insertInlineImage = async (file: File) => {
    if (!editor) {
      return;
    }

    try {
      const normalizedFile = await normalizeUploadImage(file);
      const uploadId = createUploadId();
      const previewUrl = URL.createObjectURL(normalizedFile);

      registerInlineImage(uploadId, normalizedFile, previewUrl);

      editor
        .chain()
        .focus()
        .insertContent({
          type: 'image',
          attrs: {
            src: previewUrl,
            alt: normalizedFile.name,
            uploadId,
          },
        })
        .run();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось обработать встроенное изображение.');
    }
  };

  const handleDocxImport = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          convertImage: mammoth.images.imgElement(async (element) => {
            const base64 = await element.read('base64');

            return {
              src: `data:${element.contentType};base64,${base64}`,
            };
          }),
        },
      );

      const parser = new DOMParser();
      const documentNode = parser.parseFromString(value, 'text/html');
      const images = Array.from(documentNode.querySelectorAll('img'));

      const convertibleImages = await Promise.all(
        images.map(async (image, index) => {
          const src = image.getAttribute('src');

          if (!src || !src.startsWith('data:')) {
            return null;
          }

          return {
            image,
            index,
            file: await dataUrlToFile(src, `docx-image-${index + 1}.png`),
          };
        }),
      );

      const validImages = convertibleImages.filter(
        (item): item is { image: HTMLImageElement; index: number; file: File } => Boolean(item),
      );
      const normalizedResults = await normalizeUploadImagesSettled(validImages.map((item) => item.file));

      normalizedResults.forEach((result, index) => {
        if (!result.file) {
          messageApi.warning(result.error?.message || 'Не удалось обработать изображение из .docx.');
          return;
        }

        const currentImage = validImages[index].image;
        const uploadId = createUploadId();
        const previewUrl = URL.createObjectURL(result.file);

        registerInlineImage(uploadId, result.file, previewUrl);
        currentImage.setAttribute('src', previewUrl);
        currentImage.setAttribute('data-upload-id', uploadId);
      });

      editor?.commands.setContent(documentNode.body.innerHTML, { emitUpdate: true });
      messageApi.success('Текст из .docx импортирован в редактор.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось импортировать файл .docx.');
    }

    return false;
  };

  const handleSubmit = async (targetStatus: 'draft' | 'under_review') => {
    if (uploadState.isDraftLocked) {
      messageApi.error(
        'Предыдущая загрузка завершилась ошибкой после создания upload-config. Сбросьте форму, чтобы начать заново.',
      );
      return;
    }
    if (!title.trim()) {
      messageApi.error('Введите заголовок статьи.');
      return;
    }

    if (!editor) {
      messageApi.error('Редактор пока не готов.');
      return;
    }

    if (!ageRating) {
      messageApi.error('Выберите возрастной рейтинг статьи.');
      return;
    }

    try {
      const createdPost = await mutation.mutateAsync({
        postId: editingPostId,
        title: title.trim(),
        ageRating,
        tagIds,
        status: targetStatus,
        content: editor.getJSON() as Record<string, unknown>,
        coverFile,
        inlineImages: Object.fromEntries(
          Object.entries(inlineImages).map(([uploadId, value]) => [uploadId, value.file]),
        ),
      });

      reset();
      editor.commands.clearContent();
      messageApi.success(
        createdPost.status === 'draft'
          ? 'Пост сохранён как черновик. Его можно продолжить в личном кабинете.'
          : 'Пост отправлен на модерацию. Его можно отслеживать в личном кабинете.',
      );
      navigate('/account');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось создать пост.');
    }
  };

  return (
    <Flex vertical gap={24} className="w-full">
      {MODERATION_ALERT}

      {uploadState.isDraftLocked ? (
        <Alert
          type="error"
          showIcon
          message="Загрузка остановлена после ошибки S3"
          description={
            <Flex vertical gap={12} align="flex-start">
              <span>
                {uploadState.errorMessage ||
                  'Upload-config уже был создан, но загрузка в хранилище завершилась ошибкой. Чтобы не создавать новые черновики поверх старого состояния, форма заблокирована до сброса.'}
              </span>
              <Button onClick={clearUploadLock}>Сбросить состояние загрузки</Button>
            </Flex>
          }
        />
      ) : null}

      <Flex gap={12} wrap="wrap">
        <Button
          icon={<SaveOutlined />}
          loading={mutation.isLoading || isLoadingEditablePost}
          onClick={() => handleSubmit('draft')}
        >
          Сохранить как черновик
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          loading={mutation.isLoading || isLoadingEditablePost}
          onClick={() => handleSubmit('under_review')}
        >
          Отправить на модерацию
        </Button>
      </Flex>

      <Card className="border-0 shadow-sm">
        <Flex vertical gap={20}>
          <Flex vertical gap={10}>
            <Text strong>Заголовок</Text>
            <Input
              size="large"
              placeholder="Например: Как мы собирали визуальный стиль главы"
              value={title}
              disabled={isLoadingEditablePost}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Flex>

          <Flex vertical gap={10}>
            <Text strong>Теги</Text>
            <Select
              isLoading={isLoadingTags}
              mode="multiple"
              allowClear
              showSearch
              placeholder="Выберите теги поста"
              value={tagIds}
              disabled={isLoadingEditablePost}
              options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
              onChange={(value) => setTagIds(Array.isArray(value) ? value.map(Number) : [])}
            />
            <Flex gap={8} wrap="wrap">
              {tags
                .filter((tag) => tagIds.includes(tag.id))
                .map((tag) => (
                  <Tag key={tag.id} className="m-0 rounded-full px-3 py-1">
                    #{tag.name}
                  </Tag>
                ))}
            </Flex>
          </Flex>

          <Flex vertical gap={10}>
            <Text strong>Возрастной рейтинг</Text>
            <Select
              isLoading={isLoadingTaxonomy}
              placeholder="Выберите возрастной рейтинг"
              value={ageRating}
              disabled={isLoadingEditablePost}
              options={taxonomy?.ageRatings}
              onChange={(value) => setAgeRating(String(value))}
            />
          </Flex>
        </Flex>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={8}>
          <Card className="border-0 shadow-sm">
            <Flex vertical gap={16}>
              <Flex justify="space-between" align="center">
                <Text strong>Обложка</Text>
                <Upload beforeUpload={handleSelectCover} showUploadList={false} accept={getAllowedImageAccept()}>
                  <Button icon={<PictureOutlined />} disabled={isLoadingEditablePost}>
                    Выбрать
                  </Button>
                </Upload>
              </Flex>
              <Text type="secondary">{IMAGE_REQUIREMENTS_TEXT}</Text>

              {coverPreviewUrl ? (
                <img
                  src={coverPreviewUrl}
                  alt="Предпросмотр обложки"
                  className="aspect-[4/5] w-full rounded-3xl object-cover"
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Обложка не обязательна" />
              )}
            </Flex>
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Card className="border-0 shadow-sm">
            <Flex vertical gap={16}>
              <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                gap={12}
                className="rounded-[24px] border border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)] p-3"
              >
                <Flex wrap="wrap" gap={8} className="min-w-0 flex-1">
                  <div className="min-w-[190px]">
                    <Select
                      value={currentBlockType}
                      disabled={isLoadingEditablePost}
                      options={extendedBlockTypeOptions}
                      onChange={handleBlockTypeChange}
                      placeholder="Тип блока"
                    />
                  </div>

                  {formattingButtons.map((item) => (
                    <Tooltip key={item.key} title={item.label}>
                      <Button
                        type={item.active ? 'primary' : 'default'}
                        size="small"
                        shape="round"
                        icon={item.icon}
                        disabled={isLoadingEditablePost}
                        aria-label={item.label}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          item.action();
                        }}
                      />
                    </Tooltip>
                  ))}

                  <span className="mx-0.5 h-7 w-px self-center bg-black/10" />

                  {alignmentButtons.map((item) => (
                    <Tooltip key={item.key} title={item.label}>
                      <Button
                        type={item.active ? 'primary' : 'default'}
                        size="small"
                        shape="round"
                        icon={item.icon}
                        disabled={isLoadingEditablePost}
                        aria-label={item.label}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          item.action();
                        }}
                      />
                    </Tooltip>
                  ))}
                </Flex>

                <Flex wrap="wrap" gap={8}>
                  <Button
                    size="small"
                    shape="round"
                    icon={<PlusOutlined />}
                    disabled={isLoadingEditablePost}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Картинка
                  </Button>
                  <Button
                    size="small"
                    shape="round"
                    icon={<FileWordOutlined />}
                    disabled={isLoadingEditablePost}
                    onClick={() => docxInputRef.current?.click()}
                  >
                    DOCX
                  </Button>
                </Flex>
              </Flex>

              <input
                ref={fileInputRef}
                type="file"
                accept={getAllowedImageAccept()}
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    insertInlineImage(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
              <input
                ref={docxInputRef}
                type="file"
                accept=".docx"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    await handleDocxImport(file);
                  }
                  event.currentTarget.value = '';
                }}
              />

              {editor ? <EditorContent editor={editor} /> : null}
            </Flex>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Flex vertical gap={16}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Text strong>Локальные картинки статьи</Text>
            <Tag color={colors.brand.primary}>{Object.keys(inlineImages).length}</Tag>
          </Flex>
          {Object.keys(inlineImages).length ? (
            <Flex gap={12} wrap="wrap">
              {Object.entries(inlineImages).map(([uploadId, item]) => (
                <Card
                  key={uploadId}
                  hoverable
                  className="w-[170px] border border-black/6 shadow-none"
                  cover={<img src={item.previewUrl} alt={item.file.name} className="h-36 w-full object-cover" />}
                >
                  <Card.Meta
                    title={item.file.name}
                    description={<Text type="secondary">Будет загружено только если картинка останется в статье</Text>}
                  />
                </Card>
              ))}
            </Flex>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="В теле статьи пока нет локальных изображений" />
          )}
        </Flex>
      </Card>
    </Flex>
  );
};
