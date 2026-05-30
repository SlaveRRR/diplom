import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Flex,
  Image,
  Input,
  Progress,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { FC, useEffect, useMemo, useRef } from 'react';
import { Link as RouterLink, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  FileImageOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload';

import { useCurrentUser, usePlatformTaxonomy } from '@hooks';
import { OutletContext } from '@pages';
import {
  getAllowedImageAccept,
  MAX_COMIC_CHAPTERS,
  MAX_COMIC_PAGES_PER_CHAPTER,
  MAX_IMAGE_DIMENSION_PX,
  MAX_IMAGE_UPLOAD_SIZE_MB,
  normalizeUploadImage,
} from '@utils';

import { FirstStep } from './components';
import { useComicCreateStore, useCreateComicMutation } from './hooks';
import { ChapterDraft, CreateComicPayload, LocalUploadAsset, TagSelectOption } from './types';
import { validateStep } from './utils';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const MODERATION_ALERT = (
  <Alert
    type="info"
    showIcon
    message="Памятка по модерации и размещаемому контенту"
    description={
      <span>
        Перед публикацией проверьте, что материал соответствует правилам платформы и действующим ограничениям.{' '}
        <RouterLink to="/content-guidelines">Открыть памятку</RouterLink>
      </span>
    }
  />
);

const STEP_ITEMS = [
  {
    title: 'Основа',
    description: 'Название, описание, рейтинг, жанр и теги',
  },
  {
    title: 'Медиа',
    description: 'Обложка и баннер',
  },
  {
    title: 'Главы',
    description: 'Структура и страницы',
  },
  {
    title: 'Проверка',
    description: 'Итог перед публикацией',
  },
];

const createAssetFromFile = (file: File): LocalUploadAsset => ({
  id: crypto.randomUUID(),
  file,
  fingerprint: `${file.name}-${file.size}-${file.lastModified}`,
  preview: URL.createObjectURL(file),
});

const revokeAsset = (asset: LocalUploadAsset | null) => {
  if (asset?.preview) {
    URL.revokeObjectURL(asset.preview);
  }
};

const revokeAssets = (assets: LocalUploadAsset[]) => {
  assets.forEach((asset) => revokeAsset(asset));
};

const isNativeFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File;

const getUploadFile = (file: UploadFile) => {
  if (isNativeFile(file.originFileObj)) {
    return file.originFileObj;
  }

  if (isNativeFile(file)) {
    return file;
  }

  return undefined;
};

const UPLOAD_REQUIREMENTS_TEXT = `Поддерживаются PNG, JPG и WEBP до ${MAX_IMAGE_UPLOAD_SIZE_MB} МБ и до ${MAX_IMAGE_DIMENSION_PX}px по большей стороне. PNG и JPG автоматически конвертируются в WEBP.`;

export const ComicCreate: FC = () => {
  const navigate = useNavigate();
  const { messageApi } = useOutletContext<OutletContext>();
  const { data: currentUser } = useCurrentUser();
  const { data: taxonomy, isLoading: isTaxonomyLoading } = usePlatformTaxonomy();
  const { mutation: createComicMutation, uploadState } = useCreateComicMutation();
  const cleanupRef = useRef({
    banner: null as LocalUploadAsset | null,
    chapters: [] as ChapterDraft[],
    cover: null as LocalUploadAsset | null,
  });

  const {
    title,
    description,
    ageRating,
    tagIds,
    cover,
    banner,
    chapters,
    currentStep,
    genreId,
    setCover,
    setBanner,
    addChapter,
    removeChapter,
    updateChapter,
    appendChapterPages,
    removeChapterPage,
    moveChapterPage,
    setCurrentStep,
    reset,
  } = useComicCreateStore();

  useEffect(() => {
    cleanupRef.current = {
      cover,
      banner,
      chapters,
    };
  }, [banner, chapters, cover]);

  useEffect(() => {
    return () => {
      revokeAsset(cleanupRef.current.cover);
      revokeAsset(cleanupRef.current.banner);
      cleanupRef.current.chapters.forEach((chapter) => revokeAssets(chapter.pages));
    };
  }, []);

  const tagSelectOptions = useMemo<TagSelectOption[]>(
    () =>
      (taxonomy?.tags || []).map((tag) => ({
        label: String(tag.label),
        value: Number(tag.value),
        option: {
          id: Number(tag.value),
          title: String(tag.label),
          description: tag.description,
        },
      })),
    [taxonomy?.tags],
  );

  const canPublish = Boolean(currentUser);

  const payload: Partial<CreateComicPayload> = {
    title,
    description,
    ageRating: ageRating || undefined,
    tagIds,
    genreId,
    cover,
    banner,
    chapters,
  };

  const selectedTags = tagSelectOptions.filter((tag) => tagIds.includes(tag.value));

  const syncSingleAsset = async (
    change: UploadChangeParam,
    currentAsset: LocalUploadAsset | null,
    setter: (asset: LocalUploadAsset | null) => void,
  ) => {
    const rawFile = getUploadFile(change.file);

    if (!rawFile) {
      setter(currentAsset);
      return;
    }

    try {
      const normalizedFile = await normalizeUploadImage(rawFile);

      revokeAsset(currentAsset);
      setter(createAssetFromFile(normalizedFile));
    } catch (error) {
      messageApi.warning(error instanceof Error ? error.message : 'Не удалось обработать изображение.');
      setter(currentAsset);
    }
  };

  const syncChapterAssets = async (chapter: ChapterDraft, change: UploadChangeParam) => {
    const nextFiles = change.fileList.reduce<File[]>((files, uploadFile) => {
      const file = getUploadFile(uploadFile);

      if (!file) {
        return files;
      }

      files.push(file);

      return files;
    }, []);

    if (!nextFiles.length) {
      return;
    }

    const remainingSlots = Math.max(MAX_COMIC_PAGES_PER_CHAPTER - chapter.pages.length, 0);

    if (!remainingSlots) {
      messageApi.warning(`В одной главе можно хранить не более ${MAX_COMIC_PAGES_PER_CHAPTER} страниц.`);
      return;
    }

    const limitedFiles = nextFiles.slice(0, remainingSlots);

    if (nextFiles.length > limitedFiles.length) {
      messageApi.warning(
        `Лишние страницы пропущены: в одной главе доступно только ${MAX_COMIC_PAGES_PER_CHAPTER} страниц.`,
      );
    }

    const nextAssets = (
      await Promise.all(
        limitedFiles.map(async (file) => {
          try {
            const normalizedFile = await normalizeUploadImage(file);

            return createAssetFromFile(normalizedFile);
          } catch (error) {
            messageApi.warning(error instanceof Error ? error.message : 'Не удалось обработать изображение страницы.');

            return null;
          }
        }),
      )
    ).filter((asset): asset is LocalUploadAsset => Boolean(asset));

    if (!nextAssets.length) {
      return;
    }

    const duplicateFingerprints = new Set(chapter.pages.map((page) => page.fingerprint));
    const uniqueNextAssets = nextAssets.filter((asset) => {
      const isDuplicate = duplicateFingerprints.has(asset.fingerprint);

      if (!isDuplicate) {
        duplicateFingerprints.add(asset.fingerprint);
      }

      return !isDuplicate;
    });

    nextAssets
      .filter((asset) => !uniqueNextAssets.some((uniqueAsset) => uniqueAsset.id === asset.id))
      .forEach((asset) => revokeAsset(asset));

    if (!uniqueNextAssets.length) {
      return;
    }

    appendChapterPages(chapter.id, uniqueNextAssets);
  };

  const handleStepForward = () => {
    const result = validateStep(currentStep, payload);

    if (!result.valid) {
      messageApi.warning(result.message || 'Проверь заполнение шага.', 5);
      return;
    }

    setCurrentStep(Math.min(currentStep + 1, STEP_ITEMS.length - 1));
  };

  const handleAddChapter = () => {
    if (chapters.length >= MAX_COMIC_CHAPTERS) {
      messageApi.warning(`Можно добавить не более ${MAX_COMIC_CHAPTERS} глав.`);
      return;
    }

    addChapter();
  };

  const handleSubmit = async () => {
    const validation = validateStep(2, payload);

    if (!validation.valid) {
      messageApi.warning(validation.message || 'Форма заполнена не полностью.');
      return;
    }

    if (!cover || !banner || !ageRating || !genreId) {
      return;
    }

    try {
      const response = await createComicMutation.mutateAsync({
        title,
        description,
        ageRating,
        tagIds,
        genreId,
        cover,
        banner,
        chapters,
      });

      revokeAsset(cover);
      revokeAsset(banner);
      chapters.forEach((chapter) => revokeAssets(chapter.pages));
      reset();
      messageApi.success(`Комикс "${response.title}" создан как ${response.status}.`);
      navigate('/catalog', {
        state: {
          createdComicId: response.comic_id,
        },
      });
    } catch {
      return;
    }
  };

  const renderImageUploadCard = (
    titleText: string,
    descriptionText: string,
    asset: LocalUploadAsset | null,
    onChange: (change: UploadChangeParam) => void,
    onClear: () => void,
    aspectClassName: string,
  ) => (
    <Card className="h-full rounded-2xl border-slate-200 shadow-sm">
      <Space direction="vertical" size={16} className="w-full">
        <Flex vertical gap={4}>
          <Title level={4} className="!mb-1">
            {titleText}
          </Title>
          <Text type="secondary">{descriptionText}</Text>
        </Flex>

        <Upload
          accept={getAllowedImageAccept()}
          beforeUpload={() => false}
          maxCount={1}
          showUploadList={false}
          onChange={(change) => void onChange(change)}
        >
          <Button icon={<UploadOutlined />}>Выбрать файл</Button>
        </Upload>
        <Text type="secondary">{UPLOAD_REQUIREMENTS_TEXT}</Text>

        <div
          className={`overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 ${aspectClassName}`}
        >
          {asset ? (
            <Image src={asset.preview} alt={titleText} className="h-full w-full object-cover" />
          ) : (
            <Flex vertical align="center" justify="center" className="h-full px-6 text-center">
              <FileImageOutlined className="mb-3 text-3xl text-slate-400" />
              <Text strong>Пока пусто</Text>
              <Text type="secondary">После выбора изображения здесь появится превью.</Text>
            </Flex>
          )}
        </div>

        {asset ? (
          <Card size="small" className="rounded-xl border-slate-200 bg-slate-50">
            <Flex justify="space-between" align="center" gap={16}>
              <Flex vertical className="min-w-0">
                <Text strong className="block truncate">
                  {asset.file.name}
                </Text>
                <Text type="secondary">{Math.round(asset.file.size / 1024)} KB</Text>
              </Flex>
              <Button danger icon={<DeleteOutlined />} onClick={onClear}>
                Убрать
              </Button>
            </Flex>
          </Card>
        ) : null}
      </Space>
    </Card>
  );

  const renderOverviewCard = () => (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <Space direction="vertical" size={20} className="w-full">
          <Flex vertical gap={4}>
            <Title level={3} className="!mb-2">
              Финальная проверка
            </Title>
            <Text type="secondary">
              Перед отправкой проверь, что структура комикса выглядит именно так, как ты хочешь увидеть её в черновике.
            </Text>
          </Flex>

          <div className="grid gap-4 md:grid-cols-2">
            <Card size="small" className="rounded-2xl bg-slate-50">
              <Text type="secondary">Название</Text>
              <Title level={4} className="!mb-0 !mt-2">
                {title}
              </Title>
            </Card>
            <Card size="small" className="rounded-2xl bg-slate-50">
              <Text type="secondary">Возрастной рейтинг</Text>
              <Title level={4} className="!mb-0 !mt-2">
                {ageRating}
              </Title>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card size="small" className="rounded-2xl bg-slate-50">
              <Text type="secondary">Жанр</Text>
              <Title level={4} className="!mb-0 !mt-2">
                {taxonomy?.genres.find((item) => Number(item.value) === genreId)?.label}
              </Title>
            </Card>
            <Card size="small" className="rounded-2xl bg-slate-50">
              <Text type="secondary">Теги</Text>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Tag key={tag.value} color="blue">
                    {tag.label}
                  </Tag>
                ))}
              </div>
            </Card>
          </div>

          <Card size="small" className="rounded-2xl bg-slate-50">
            <Text type="secondary">Описание</Text>
            <Paragraph className="!mb-0 !mt-2 whitespace-pre-line">{description}</Paragraph>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {cover ? (
              <Card
                size="small"
                cover={<Image src={cover.preview} alt="Обложка" preview={false} className="h-56 object-cover" />}
                className="overflow-hidden rounded-2xl"
              >
                <Text strong>Обложка</Text>
              </Card>
            ) : null}
            {banner ? (
              <Card
                size="small"
                cover={<Image src={banner.preview} alt="Баннер" preview={false} className="h-56 object-cover" />}
                className="overflow-hidden rounded-2xl"
              >
                <Text strong>Баннер</Text>
              </Card>
            ) : null}
          </div>
        </Space>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <Space direction="vertical" size={18} className="w-full">
          <Flex vertical gap={4}>
            <Title level={4} className="!mb-1">
              Главы
            </Title>
            <Text type="secondary">Краткая сводка по всем добавленным главам и их страницам.</Text>
          </Flex>

          {chapters.map((chapter) => (
            <Card key={chapter.id} size="small" className="rounded-2xl border-slate-200 bg-slate-50">
              <Space direction="vertical" size={12} className="w-full">
                <Flex vertical gap={2}>
                  <Text type="secondary">Глава {chapter.chapterNumber}</Text>
                  <Title level={5} className="!mb-0 !mt-1">
                    {chapter.title}
                  </Title>
                </Flex>
                <Text type="secondary">{chapter.description}</Text>
                <Text strong>{chapter.pages.length} стр.</Text>
              </Space>
            </Card>
          ))}
        </Space>
      </Card>
    </div>
  );

  return (
    <Flex vertical gap={24} className="py-6 md:gap-8 md:py-8">
      {!canPublish ? <Alert type="warning" showIcon message="Нужна авторизация, чтобы загрузить комикс." /> : null}

      {MODERATION_ALERT}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <Steps current={currentStep} items={STEP_ITEMS} responsive />
      </Card>

      {createComicMutation.isLoading ? (
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <Space direction="vertical" size={16} className="w-full">
            <Flex align="center" gap={12}>
              <Spin />
              <Flex vertical gap={2}>
                <Text strong>
                  {uploadState.stage === 'config' ? 'Готовим upload-config' : null}
                  {uploadState.stage === 'upload' ? 'Загружаем файлы в S3' : null}
                  {uploadState.stage === 'confirm' ? 'Подтверждаем создание комикса' : null}
                  {uploadState.stage === 'idle' ? 'Создаём комикс' : null}
                </Text>
                <Text type="secondary">
                  {uploadState.stage === 'config'
                    ? 'Собираем конфиг загрузки для обложки, баннера и страниц глав.'
                    : null}
                  {uploadState.stage === 'upload'
                    ? 'Загружаем изображения последовательно и отслеживаем прогресс.'
                    : null}
                  {uploadState.stage === 'confirm' ? 'Файлы уже в S3, завершаем создание комикса на backend.' : null}
                  {uploadState.stage === 'idle' ? 'Подготавливаем процесс загрузки.' : null}
                </Text>
              </Flex>
            </Flex>

            {uploadState.totalFiles ? (
              <Progress
                percent={Math.round((uploadState.uploadedFiles / uploadState.totalFiles) * 100)}
                status="active"
              />
            ) : null}

            {uploadState.totalFiles ? (
              <Text type="secondary">
                Загружено файлов: {uploadState.uploadedFiles} из {uploadState.totalFiles}
              </Text>
            ) : null}
          </Space>
        </Card>
      ) : null}

      {createComicMutation.isLoading ? (
        <Alert
          type="info"
          showIcon
          message="Загружаем файлы и создаём комикс"
          description="Сначала формируется upload-config, затем обложка, баннер и страницы загружаются в S3, после чего отправляется confirm."
        />
      ) : null}

      {currentStep === 0 ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <FirstStep />
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {renderImageUploadCard(
            'Обложка',
            'Основная карточка комикса для каталога и списка релизов.',
            cover,
            (change) => syncSingleAsset(change, cover, setCover),
            () => {
              revokeAsset(cover);
              setCover(null);
            },
            'aspect-[4/5]',
          )}
          {renderImageUploadCard(
            'Баннер',
            'Широкое изображение для шапки, подборок и редакционных блоков.',
            banner,
            (change) => syncSingleAsset(change, banner, setBanner),
            () => {
              revokeAsset(banner);
              setBanner(null);
            },
            'aspect-[16/9]',
          )}
        </div>
      ) : null}

      {currentStep === 2 ? (
        <Flex vertical gap={24}>
          <Flex justify="space-between" align="center" gap={16} wrap>
            <Flex vertical gap={4}>
              <Title level={3} className="!mb-1">
                Главы и страницы
              </Title>
              <Text type="secondary">
                Каждая глава хранит свою структуру и набор страниц. Превью сразу показываются карточками.
              </Text>
            </Flex>

            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddChapter}>
              Добавить главу
            </Button>
          </Flex>

          {chapters.length ? (
            <div className="space-y-6">
              {chapters.map((chapter) => (
                <Card key={chapter.id} className="rounded-3xl border-slate-200 shadow-sm">
                  <Space direction="vertical" size={20} className="w-full">
                    <Flex justify="space-between" align="center" gap={16} wrap>
                      <Flex vertical gap={8}>
                        <Tag color="blue" className="mb-2 rounded-full">
                          Глава {chapter.chapterNumber}
                        </Tag>
                        <Title level={4} className="!mb-0">
                          {chapter.title || `Новая глава ${chapter.chapterNumber}`}
                        </Title>
                      </Flex>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          revokeAssets(chapter.pages);
                          removeChapter(chapter.id);
                        }}
                      >
                        Удалить
                      </Button>
                    </Flex>

                    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="space-y-4">
                        <div>
                          <Text strong>Название главы</Text>
                          <Input
                            className="mt-2"
                            placeholder="Например, Глава 1. Пепел у порога"
                            value={chapter.title}
                            onChange={(event) =>
                              updateChapter(chapter.id, {
                                title: event.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Text strong>Описание главы</Text>
                          <TextArea
                            rows={4}
                            className="mt-2"
                            placeholder="Короткая подводка к содержанию главы."
                            value={chapter.description}
                            onChange={(event) =>
                              updateChapter(chapter.id, {
                                description: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                          <Flex justify="space-between" align="center" gap={12} wrap>
                            <Flex vertical gap={4}>
                              <Text strong>Страницы главы</Text>
                              <Text className="text-sm text-slate-500">
                                {`До ${MAX_COMIC_PAGES_PER_CHAPTER} страниц в главе. ${UPLOAD_REQUIREMENTS_TEXT}`}
                              </Text>
                            </Flex>
                            <Dragger
                              accept={getAllowedImageAccept()}
                              multiple
                              beforeUpload={() => false}
                              showUploadList={false}
                              className="!border-0 !bg-transparent"
                              onChange={(change) => void syncChapterAssets(chapter, change)}
                            >
                              <Flex vertical align="center" gap={10} className="py-4 text-center">
                                <UploadOutlined className="text-2xl text-slate-500" />
                                <Text strong>Перетащи страницы сюда или нажми для выбора</Text>
                                <Text className="max-w-xl text-sm text-slate-500">
                                  {`${UPLOAD_REQUIREMENTS_TEXT} Новые изображения добавляются в конец, а порядок можно менять прямо на карточках ниже.`}
                                </Text>
                              </Flex>
                            </Dragger>
                          </Flex>
                        </div>

                        {chapter.pages.length ? (
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {chapter.pages.map((page, pageIndex) => (
                              <Card
                                key={page.id}
                                cover={
                                  <Image
                                    src={page.preview}
                                    alt={`${chapter.title || 'Глава'} страница ${pageIndex + 1}`}
                                    className="h-56 object-cover"
                                  />
                                }
                                className="overflow-hidden rounded-2xl border-slate-200"
                              >
                                <Space direction="vertical" size={6} className="w-full">
                                  <Flex justify="space-between" align="start" gap={8}>
                                    <Tag className="w-fit rounded-full">Страница {pageIndex + 1}</Tag>

                                    <Space size={4}>
                                      <Button
                                        size="small"
                                        icon={<ArrowUpOutlined />}
                                        disabled={pageIndex === 0}
                                        onClick={() => moveChapterPage(chapter.id, pageIndex, 'backward')}
                                      />

                                      <Button
                                        size="small"
                                        icon={<ArrowDownOutlined />}
                                        disabled={pageIndex === chapter.pages.length - 1}
                                        onClick={() => moveChapterPage(chapter.id, pageIndex, 'forward')}
                                      />

                                      <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                          revokeAsset(page);
                                          removeChapterPage(chapter.id, pageIndex);
                                        }}
                                      />
                                    </Space>
                                  </Flex>

                                  <Text strong className="block truncate">
                                    {page.file.name}
                                  </Text>

                                  <Text type="secondary">{Math.round(page.file.size / 1024)} KB</Text>
                                </Space>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Пока нет загруженных страниц. Добавь изображения, и они появятся здесь карточками."
                          />
                        )}
                      </div>
                    </div>
                  </Space>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <Empty description="Начни с первой главы, чтобы собрать структуру комикса." />
            </Card>
          )}
        </Flex>
      ) : null}

      {currentStep === 3 ? renderOverviewCard() : null}

      <Divider className="!my-0" />

      <Flex justify="space-between" align="center" gap={16} wrap>
        <Button
          disabled={currentStep === 0 || createComicMutation.isLoading}
          onClick={() => setCurrentStep(currentStep - 1)}
        >
          Назад
        </Button>

        <Space size={12} wrap>
          <Button
            onClick={() => {
              revokeAsset(cover);
              revokeAsset(banner);
              chapters.forEach((chapter) => revokeAssets(chapter.pages));
              reset();
            }}
            disabled={createComicMutation.isLoading}
          >
            Сбросить
          </Button>
          {currentStep < STEP_ITEMS.length - 1 ? (
            <Button type="primary" onClick={handleStepForward} disabled={createComicMutation.isLoading || !canPublish}>
              Далее
            </Button>
          ) : (
            <Button
              type="primary"
              loading={createComicMutation.isLoading}
              onClick={handleSubmit}
              disabled={!canPublish}
            >
              Создать комикс
            </Button>
          )}
        </Space>
      </Flex>

      {isTaxonomyLoading ? (
        <Flex justify="center" className="py-8">
          <Spin />
        </Flex>
      ) : null}
    </Flex>
  );
};
