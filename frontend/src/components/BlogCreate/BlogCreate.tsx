import { Button, Card, Col, Empty, Flex, Input, Row, Tag, Tooltip, Typography, Upload } from 'antd';
import mammoth from 'mammoth';
import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  BoldOutlined,
  FileWordOutlined,
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
import { useBlogTagsQuery } from '@components/Blog/hooks';
import { Select } from '@components/shared';
import { OutletContext } from '@pages/LayoutPage/types';

import { BlogImage } from './editor/blogImageExtension';
import { useBlogCreateStore, useCreateBlogPostMutation, useEditableBlogPostQuery } from './hooks';

const { Paragraph, Text, Title } = Typography;

const createUploadId = () => `blog-image-${crypto.randomUUID()}`;

type ToolbarButton = {
  key: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  action: () => void;
};

type BlockTypeValue = 'paragraph' | 'heading-2' | 'heading-3' | 'blockquote';

const blockTypeOptions = [
  { value: 'paragraph', label: 'Параграф' },
  { value: 'heading-2', label: 'Заголовок H2' },
  { value: 'heading-3', label: 'Заголовок H3' },
  { value: 'blockquote', label: 'Цитата' },
] satisfies Array<{ value: BlockTypeValue; label: string }>;

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
  const mutation = useCreateBlogPostMutation();
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
    extensions: [StarterKit, BlogImage],
    content: editorJson,
    editorProps: {
      attributes: {
        class:
          'min-h-[360px] rounded-[24px] border border-black/8 bg-white px-4 py-4 text-[15px] leading-7 outline-none [&_p]:my-3 [&_h2]:my-4 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h3]:my-3 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-tight [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-primary)] [&_blockquote]:bg-black/[0.03] [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-4 [&_img]:rounded-2xl',
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
      isBulletList: currentEditor.isActive('bulletList'),
      isOrderedList: currentEditor.isActive('orderedList'),
      isBlockquote: currentEditor.isActive('blockquote'),
      isHeading2: currentEditor.isActive('heading', { level: 2 }),
      isHeading3: currentEditor.isActive('heading', { level: 3 }),
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

    if (editorState?.isHeading2) {
      return 'heading-2';
    }

    if (editorState?.isHeading3) {
      return 'heading-3';
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

  const handleSelectCover = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setCoverFile(file, previewUrl);

    return false;
  };

  const handleBlockTypeChange = (value: string | number) => {
    if (!editor) {
      return;
    }

    const normalizedValue = value as BlockTypeValue;

    switch (normalizedValue) {
      case 'heading-2':
        editor.chain().focus().setHeading({ level: 2 }).run();
        break;
      case 'heading-3':
        editor.chain().focus().setHeading({ level: 3 }).run();
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

  const insertInlineImage = (file: File) => {
    if (!editor) {
      return;
    }

    const uploadId = createUploadId();
    const previewUrl = URL.createObjectURL(file);
    registerInlineImage(uploadId, file, previewUrl);

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'image',
        attrs: {
          src: previewUrl,
          alt: file.name,
          uploadId,
        },
      })
      .run();
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

      for (const [index, image] of images.entries()) {
        const src = image.getAttribute('src');

        if (!src || !src.startsWith('data:')) {
          continue;
        }

        const fileFromDocx = await dataUrlToFile(src, `docx-image-${index + 1}.png`);
        const uploadId = createUploadId();
        const previewUrl = URL.createObjectURL(fileFromDocx);

        registerInlineImage(uploadId, fileFromDocx, previewUrl);
        image.setAttribute('src', previewUrl);
        image.setAttribute('data-upload-id', uploadId);
      }

      editor?.commands.setContent(documentNode.body.innerHTML, { emitUpdate: true });
      messageApi.success('Текст из .docx импортирован в редактор.');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : 'Не удалось импортировать файл .docx.');
    }

    return false;
  };

  const handleSubmit = async (targetStatus: 'draft' | 'under_review') => {
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
      <section className="rounded-[32px] border border-black/6 bg-[radial-gradient(circle_at_top_left,rgba(255,208,91,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(46,144,250,0.12),transparent_26%),linear-gradient(135deg,#fffef9_0%,#ffffff_100%)] p-6 shadow-[0_20px_60px_rgba(32,20,82,0.06)] sm:p-8">
        <Flex justify="space-between" align="start" wrap="wrap" gap={16}>
          <Flex vertical gap={8} className="max-w-3xl">
            <Title level={1} className="!mb-0 !text-3xl sm:!text-4xl">
              {editingPostId ? 'Редактирование поста' : 'Создание поста'}
            </Title>
            <Paragraph className="!mb-0 text-base text-[var(--color-text-secondary)]">
              {editingPostId
                ? 'Продолжайте работу над черновиком, обновляйте текст и снова сохраняйте его как черновик или отправляйте на модерацию.'
                : 'Пишите статьи в JSON-редакторе, при желании добавляйте обложку, вставляйте изображения в тело поста и импортируйте черновик из .docx.'}
            </Paragraph>
          </Flex>
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
        </Flex>
      </section>

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
                <Upload beforeUpload={handleSelectCover} showUploadList={false} accept="image/*">
                  <Button icon={<PictureOutlined />} disabled={isLoadingEditablePost}>
                    Выбрать
                  </Button>
                </Upload>
              </Flex>

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
                      options={blockTypeOptions}
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

              <div className="rounded-2xl border border-dashed border-black/8 bg-black/[0.015] px-4 py-3">
                <Text type="secondary">
                  Селект меняет тип текущего блока, а кнопки работают по выделению или по текущей позиции курсора.
                </Text>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
