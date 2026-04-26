import { Button, Card, Drawer, Empty, Flex, FloatButton, Grid, List, Skeleton, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import {
  BookOutlined,
  CommentOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  HeartFilled,
  HeartOutlined,
  LeftOutlined,
  MenuOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';

import { api } from '@api';
import { useApp, useRequireAuthAction } from '@hooks';
import { CATALOG_QUERY_KEY } from '@components/Catalog/hooks/useCatalogStore/useCatalogStore';
import { OutletContext } from '@pages/LayoutPage/types';

import { COMIC_DETAILS_QUERY_KEY } from '../ComicDetails/hooks/useComicDetailsQuery';
import { useComicReaderQuery, useComicReadingProgressMutation } from './hooks';
import { COMIC_READER_QUERY_KEY } from './hooks/useComicReaderQuery';
import { ReaderLocalProgress } from './types';

const { Text, Title } = Typography;

const getGuestProgressKey = (comicId: string) => `comic-reader-progress:${comicId}`;

export const ComicReader = () => {
  const screens = Grid.useBreakpoint();
  const queryClient = useQueryClient();
  const { comicId, chapterId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { messageApi } = useOutletContext<OutletContext>();
  const { isAuth } = useApp();
  const { redirectToAuth } = useRequireAuthAction();
  const { data, isLoading, isError } = useComicReaderQuery(comicId, chapterId);
  const { mutate: saveReadingProgress } = useComicReadingProgressMutation(comicId, chapterId);

  const [isEpisodesOpen, setIsEpisodesOpen] = useState(false);
  const [isReaderChromeVisible, setIsReaderChromeVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [pagesReadyToLoad, setPagesReadyToLoad] = useState<Record<number, boolean>>({});
  const [loadedPages, setLoadedPages] = useState<Record<number, boolean>>({});
  const progressTimerRef = useRef<number | null>(null);
  const pageElementsRef = useRef<Record<number, HTMLDivElement | null>>({});
  const hasInitialScrollRef = useRef(false);
  const lastSavedPageRef = useRef<number | null>(null);
  const initializedChapterRef = useRef<number | null>(null);

  const isPreview = searchParams.has('preview');

  const guestProgress = useMemo(() => {
    if (!comicId || typeof window === 'undefined') {
      return null;
    }

    const raw = window.localStorage.getItem(getGuestProgressKey(comicId));

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as ReaderLocalProgress;
    } catch {
      return null;
    }
  }, [comicId]);

  const resumePage = useMemo(() => {
    if (!data) {
      return 1;
    }

    if (isAuth && data.progress?.chapterId === data.chapter.id) {
      return Math.min(data.progress.lastPage, data.chapter.pageCount);
    }

    if (!isAuth && guestProgress?.chapterId === data.chapter.id) {
      return Math.min(guestProgress.lastPage, data.chapter.pageCount);
    }

    return 1;
  }, [data, guestProgress, isAuth]);

  useEffect(() => {
    hasInitialScrollRef.current = false;
    setActivePage(1);
    setPagesReadyToLoad({});
    setLoadedPages({});
    lastSavedPageRef.current = null;
    initializedChapterRef.current = null;
  }, [chapterId]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (initializedChapterRef.current === data.chapter.id) {
      return;
    }

    const initialPages = new Set<number>([
      1,
      resumePage,
      Math.max(resumePage - 1, 1),
      Math.min(resumePage + 1, data.chapter.pageCount),
    ]);

    setPagesReadyToLoad(Object.fromEntries(Array.from(initialPages).map((pageIndex) => [pageIndex, true])));
    setLoadedPages({});
    lastSavedPageRef.current = resumePage;
    initializedChapterRef.current = data.chapter.id;
    setIsReaderChromeVisible(!isPreview);
  }, [data, resumePage, isPreview]);

  useEffect(() => {
    if (!data || hasInitialScrollRef.current) {
      return;
    }

    const targetPage = pageElementsRef.current[resumePage];

    if (targetPage) {
      targetPage.scrollIntoView({ block: 'start' });
      setActivePage(resumePage);
      hasInitialScrollRef.current = true;
    }
  }, [data, resumePage]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const pageIndex = Number(visibleEntry.target.getAttribute('data-page-index'));

        if (pageIndex) {
          setActivePage(pageIndex);
        }
      },
      {
        threshold: [0.35, 0.6, 0.85],
      },
    );

    Object.values(pageElementsRef.current).forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [data]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const pageIndexes = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number(entry.target.getAttribute('data-page-index')))
          .filter(Boolean);

        if (!pageIndexes.length) {
          return;
        }

        setPagesReadyToLoad((current) => {
          const next = { ...current };
          let changed = false;

          pageIndexes.forEach((pageIndex) => {
            if (!next[pageIndex]) {
              next[pageIndex] = true;
              changed = true;
            }
          });

          return changed ? next : current;
        });
      },
      {
        rootMargin: '1400px 0px',
        threshold: 0.01,
      },
    );

    Object.values(pageElementsRef.current).forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [data]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!data || isPreview) {
      return;
    }

    if (isAuth) {
      if (lastSavedPageRef.current === activePage) {
        return;
      }

      if (progressTimerRef.current) {
        window.clearTimeout(progressTimerRef.current);
      }

      progressTimerRef.current = window.setTimeout(() => {
        saveReadingProgress(activePage);
        lastSavedPageRef.current = activePage;
      }, 700);

      return () => {
        if (progressTimerRef.current) {
          window.clearTimeout(progressTimerRef.current);
        }
      };
    }

    if (comicId && guestProgress?.lastPage !== activePage) {
      window.localStorage.setItem(
        getGuestProgressKey(comicId),
        JSON.stringify({
          chapterId: data.chapter.id,
          lastPage: activePage,
        }),
      );
    }
  }, [activePage, comicId, data?.chapter.id, guestProgress?.lastPage, isAuth, isPreview, saveReadingProgress]);

  const toggleFullscreen = async () => {
    if (typeof document === 'undefined') {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      messageApi.error('Не удалось переключить полноэкранный режим.');
    }
  };

  const invalidateComicInteractionQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries([COMIC_DETAILS_QUERY_KEY, comicId]),
      queryClient.invalidateQueries([COMIC_READER_QUERY_KEY, comicId]),
      queryClient.invalidateQueries([CATALOG_QUERY_KEY]),
    ]);
  };

  if (isLoading) {
    return (
      <Flex vertical gap={24} className="w-full">
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
        <Skeleton.Image active className="!h-[70vh] !w-full" />
      </Flex>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-0 shadow-sm">
        <Empty description="Не удалось открыть ридер этой главы.">
          <Link to={comicId ? `/comics/${comicId}` : '/catalog'}>
            <Button type="primary">Вернуться назад</Button>
          </Link>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="-mt-6 min-h-screen w-full  bg-[#1c1623] text-white">
      {!isPreview ? (
        <div
          className={`sticky top-0 z-20 w-full border-b border-white/10 bg-[#24193e]/95 px-3 py-3 backdrop-blur transition-all duration-300 sm:px-6 ${
            isReaderChromeVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
          }`}
        >
          <Flex
            vertical={!screens.md}
            align={screens.md ? 'center' : 'stretch'}
            justify="space-between"
            gap={screens.md ? 12 : 8}
            className="w-full"
          >
            <Flex align="center" gap={screens.md ? 16 : 10} className="min-w-0 w-full flex-1">
              <Button
                type="text"
                size={screens.md ? 'large' : 'middle'}
                icon={<LeftOutlined />}
                className="!text-white"
                onClick={() => navigate(`/comics/${data.comicId}`)}
              />
              <Flex vertical gap={0} className="min-w-0 flex-1">
                <Title
                  level={screens.md ? 3 : 4}
                  className="!mb-0 !text-white"
                  style={{
                    lineHeight: screens.md ? 1.1 : 1.2,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  {data.comicTitle}
                </Title>
                <Text
                  className="text-white/75"
                  style={{
                    fontSize: screens.md ? undefined : 14,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  Эпизод №{data.chapter.chapterNumber} — {data.chapter.title}
                </Text>
              </Flex>
            </Flex>

            <Flex
              align="center"
              justify={screens.md ? 'start' : 'end'}
              gap={screens.md ? 12 : 4}
              className={screens.md ? 'shrink-0' : 'w-full'}
            >
              <Button
                type="text"
                className="!text-white"
                icon={data.isFavorite ? <StarFilled /> : <StarOutlined />}
                onClick={async () => {
                  if (!isAuth) {
                    redirectToAuth('favorite');
                    return;
                  }

                  try {
                    await api.toggleComicFavorite(data.comicId);
                    await invalidateComicInteractionQueries();
                    messageApi.success('Избранное обновлено.');
                  } catch (error) {
                    messageApi.error(error instanceof Error ? error.message : 'Не удалось обновить избранное.');
                  }
                }}
              >
                {screens.md ? 'Подписаться' : null}
              </Button>
              <Button
                type="text"
                size={screens.md ? 'middle' : 'small'}
                className="!text-white"
                icon={<MenuOutlined />}
                onClick={() => setIsEpisodesOpen(true)}
              />
              <Button
                type="text"
                size={screens.md ? 'middle' : 'small'}
                className="!text-white"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
            </Flex>
          </Flex>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[1120px] overflow-x-hidden bg-[#111]">
        {data.chapter.pages.map((page) => (
          <div
            key={page.index}
            ref={(element) => {
              pageElementsRef.current[page.index] = element;
            }}
            data-page-index={page.index}
            onClick={() => {
              if (!isPreview) {
                setIsReaderChromeVisible((current) => !current);
              }
            }}
            className="relative min-h-[40vh] bg-[#151018] sm:min-h-[60vh]"
          >
            {pagesReadyToLoad[page.index] ? (
              <>
                {!loadedPages[page.index] ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#151018]">
                    <Skeleton.Image active className="!h-[40vh] !w-full sm:!h-[60vh]" />
                  </div>
                ) : null}
                <img
                  src={page.url}
                  alt={`${data.comicTitle} page ${page.index}`}
                  loading="lazy"
                  className={`block h-auto max-w-full w-full transition-opacity duration-300 ${
                    loadedPages[page.index] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => {
                    setLoadedPages((current) => ({
                      ...current,
                      [page.index]: true,
                    }));
                  }}
                  onError={() => {
                    setLoadedPages((current) => ({
                      ...current,
                      [page.index]: true,
                    }));
                  }}
                />
              </>
            ) : (
              <div className="flex min-h-[40vh] items-center justify-center bg-[#151018] sm:min-h-[60vh]">
                <Skeleton.Image active className="!h-[40vh] !w-full sm:!h-[60vh]" />
              </div>
            )}
          </div>
        ))}
      </div>

      {!isPreview ? (
        <>
          <Drawer
            title="Список эпизодов"
            placement="bottom"
            open={isEpisodesOpen}
            onClose={() => setIsEpisodesOpen(false)}
            height="65vh"
          >
            <List
              dataSource={data.chapters}
              renderItem={(chapter) => (
                <List.Item
                  actions={[
                    chapter.id === data.chapter.id ? (
                      <Text key="current" strong>
                        Сейчас
                      </Text>
                    ) : (
                      <Button
                        key="open"
                        type="link"
                        onClick={() => {
                          setIsEpisodesOpen(false);
                          navigate(`/comics/${data.comicId}/chapters/${chapter.id}`);
                        }}
                      >
                        Открыть
                      </Button>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    title={`Эпизод №${chapter.chapterNumber} — ${chapter.title}`}
                    description={chapter.id === data.chapter.id ? `Текущая страница: ${activePage}` : null}
                  />
                </List.Item>
              )}
            />
          </Drawer>

          <div
            className={`fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#24193e]/95 px-3 py-3 backdrop-blur transition-all duration-300 sm:px-6 ${
              isReaderChromeVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
            }`}
          >
            <Flex align="center" justify="space-between" gap={12} wrap="wrap">
              <Flex align="center" gap={12} wrap="wrap">
                <Button
                  size={screens.md ? 'middle' : 'large'}
                  icon={<BookOutlined />}
                  onClick={() => navigate(`/comics/${data.comicId}`)}
                >
                  К комиксу
                </Button>
                <Text className="text-white/80" style={{ fontSize: screens.md ? undefined : 15 }}>
                  Страница {activePage} из {data.chapter.pageCount}
                </Text>
              </Flex>

              <Flex align="center" gap={8} wrap="wrap" className={screens.md ? '' : 'w-full'}>
                {data.navigation.previousChapterId ? (
                  <Button
                    block={!screens.md}
                    onClick={() => navigate(`/comics/${data.comicId}/chapters/${data.navigation.previousChapterId}`)}
                  >
                    Предыдущая глава
                  </Button>
                ) : null}
                {data.navigation.nextChapterId ? (
                  <Button
                    type="primary"
                    block={!screens.md}
                    onClick={() => navigate(`/comics/${data.comicId}/chapters/${data.navigation.nextChapterId}`)}
                  >
                    Следующая глава
                  </Button>
                ) : null}
                <Button block={!screens.md} icon={<MenuOutlined />} onClick={() => setIsEpisodesOpen(true)}>
                  Список эпизодов
                </Button>
              </Flex>
            </Flex>
          </div>

          {isReaderChromeVisible ? (
            <FloatButton.Group
              shape="square"
              style={{
                insetInlineEnd: screens.md ? 24 : 12,
                bottom: screens.md ? 112 : 104,
              }}
            >
              <FloatButton
                icon={data.isLiked ? <HeartFilled /> : <HeartOutlined />}
                tooltip={`${data.likesCount} лайков`}
                onClick={async () => {
                  if (!isAuth) {
                    redirectToAuth('like');
                    return;
                  }

                  try {
                    await api.toggleComicLike(data.comicId);
                    await invalidateComicInteractionQueries();
                    messageApi.success('Лайк обновлён.');
                  } catch (error) {
                    messageApi.error(error instanceof Error ? error.message : 'Не удалось обновить лайк.');
                  }
                }}
              />
              <FloatButton
                icon={<CommentOutlined />}
                tooltip={`${data.commentsCount} комментариев`}
                onClick={() => navigate(`/comics/${data.comicId}#comments`)}
              />
              <FloatButton
                icon={<ShareAltOutlined />}
                tooltip="Поделиться"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    messageApi.success('Ссылка на главу скопирована.');
                  } catch {
                    messageApi.error('Не удалось скопировать ссылку.');
                  }
                }}
              />
              <FloatButton
                icon={<UpOutlined />}
                tooltip="Наверх"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
              <FloatButton
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                tooltip={isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'}
                onClick={toggleFullscreen}
              />
            </FloatButton.Group>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
