import { Button, Card, Drawer, Empty, Flex, FloatButton, Grid, List, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRightOutlined,
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
import { CATALOG_QUERY_KEY } from '@components/Catalog/hooks/useCatalogStore/useCatalogStore';
import { useApp } from '@hooks/useApp';
import { useRequireAuthAction } from '@hooks/useRequireAuthAction';
import { OutletContext } from '@pages/LayoutPage/types';

import { COMIC_DETAILS_QUERY_KEY } from '../ComicDetails/hooks/useComicDetailsQuery';
import { ReaderHeaderSkeleton, ReaderPageSkeleton } from './components';
import { useComicReaderQuery, useComicReadingProgressMutation } from './hooks';
import { COMIC_READER_QUERY_KEY } from './hooks/useComicReaderQuery';
import { ReaderLocalProgress } from './types';

const { Text, Title } = Typography;

const GUEST_PROGRESS_STORAGE_KEY = (comicId: string) => `comic-reader-progress:${comicId}`;
const READER_MODE_STORAGE_KEY = 'comic-reader-mode';

type ReaderMode = 'scroll' | 'paged';

const getInitialReaderMode = (): ReaderMode => {
  if (typeof window === 'undefined') {
    return 'scroll';
  }

  return window.localStorage.getItem(READER_MODE_STORAGE_KEY) === 'paged' ? 'paged' : 'scroll';
};

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
  const [readerMode, setReaderMode] = useState<ReaderMode>(getInitialReaderMode);
  const [activePage, setActivePage] = useState(1);
  const [pagesReadyToLoad, setPagesReadyToLoad] = useState<Record<number, boolean>>({});
  const [loadedPages, setLoadedPages] = useState<Record<number, boolean>>({});

  const progressTimerRef = useRef<number | null>(null);
  const pageElementsRef = useRef<Record<number, HTMLDivElement | null>>({});
  const hasInitialScrollRef = useRef(false);
  const lastSavedPageRef = useRef<number | null>(null);
  const initializedChapterRef = useRef<number | null>(null);

  const isPreview = searchParams.has('preview');
  const isPagedMode = readerMode === 'paged';

  const isDraft = data?.status === 'draft';

  const guestProgress = useMemo(() => {
    if (!comicId || typeof window === 'undefined') {
      return null;
    }

    const raw = window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY(comicId));

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
    lastSavedPageRef.current = null;
    initializedChapterRef.current = null;
    setActivePage(1);
    setPagesReadyToLoad({});
    setLoadedPages({});
  }, [chapterId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(READER_MODE_STORAGE_KEY, readerMode);
  }, [readerMode]);

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
    setActivePage(resumePage);
    setIsReaderChromeVisible(!isPreview);
    lastSavedPageRef.current = resumePage;
    initializedChapterRef.current = data.chapter.id;
  }, [data, isPreview, resumePage]);

  useEffect(() => {
    if (!data || hasInitialScrollRef.current) {
      return;
    }

    if (isPagedMode) {
      hasInitialScrollRef.current = true;
      return;
    }

    const targetPage = pageElementsRef.current[resumePage];

    if (targetPage) {
      targetPage.scrollIntoView({ block: 'start' });
      setActivePage(resumePage);
      hasInitialScrollRef.current = true;
    }
  }, [data, isPagedMode, resumePage]);

  useEffect(() => {
    if (!data || isPagedMode) {
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
  }, [data, isPagedMode]);

  useEffect(() => {
    if (!data || isPagedMode) {
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
  }, [data, isPagedMode]);

  useEffect(() => {
    if (!data || !isPagedMode) {
      return;
    }

    setPagesReadyToLoad((current) => {
      const next = { ...current };
      let changed = false;

      [activePage - 1, activePage, activePage + 1]
        .filter((pageIndex) => pageIndex >= 1 && pageIndex <= data.chapter.pageCount)
        .forEach((pageIndex) => {
          if (!next[pageIndex]) {
            next[pageIndex] = true;
            changed = true;
          }
        });

      return changed ? next : current;
    });
  }, [activePage, data, isPagedMode]);

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
        GUEST_PROGRESS_STORAGE_KEY(comicId),
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

  const handleReaderModeChange = (mode: ReaderMode) => {
    setReaderMode(mode);

    if (mode === 'paged') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.requestAnimationFrame(() => {
      const currentPageElement = pageElementsRef.current[activePage];

      if (currentPageElement) {
        currentPageElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    });
  };

  const handlePagedNavigation = (direction: 'prev' | 'next') => {
    setActivePage((currentPage) => {
      const nextPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;

      return Math.min(Math.max(nextPage, 1), data?.chapter.pageCount ?? 1);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = (pageIndex: number, pageUrl: string) => {
    const isLoaded = loadedPages[pageIndex];
    const isReady = pagesReadyToLoad[pageIndex];

    if (!isReady) {
      return <ReaderPageSkeleton />;
    }

    return (
      <>
        {!isLoaded ? (
          <div className="absolute inset-0">
            <ReaderPageSkeleton />
          </div>
        ) : null}
        <img
          src={pageUrl}
          alt={`${data?.comicTitle ?? 'Комикс'} page ${pageIndex}`}
          loading="lazy"
          className={`block transition-opacity duration-300 ${
            isPagedMode ? 'h-auto max-h-[calc(100vh-180px)] max-w-full' : 'h-auto max-w-full w-full'
          } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => {
            setLoadedPages((current) => ({
              ...current,
              [pageIndex]: true,
            }));
          }}
          onError={() => {
            setLoadedPages((current) => ({
              ...current,
              [pageIndex]: true,
            }));
          }}
        />
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="-mt-6 min-h-screen w-full bg-[#1c1623] text-white">
        <ReaderHeaderSkeleton />
        <div className="mx-auto w-full max-w-[1120px] overflow-x-hidden bg-[#111]">
          <ReaderPageSkeleton className="min-h-[58vh] sm:min-h-[72vh]" />
          <ReaderPageSkeleton className="min-h-[42vh] sm:min-h-[56vh]" />
        </div>
      </div>
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

  const currentPage = data.chapter.pages[Math.max(activePage - 1, 0)] ?? data.chapter.pages[0];

  return (
    <div className="-mt-6 min-h-screen w-full bg-[#1c1623] text-white">
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
      <div className="mx-auto w-full max-w-[1120px] overflow-x-hidden bg-[#111]">
        {isPagedMode ? (
          <div
            data-page-index={currentPage.index}
            onClick={() => {
              setIsReaderChromeVisible((current) => !current);
            }}
            className="relative flex min-h-[40vh] items-center justify-center bg-[#151018] sm:min-h-[60vh]"
          >
            {renderPage(currentPage.index, currentPage.url)}
          </div>
        ) : (
          data.chapter.pages.map((page) => (
            <div
              key={page.index}
              ref={(element) => {
                pageElementsRef.current[page.index] = element;
              }}
              data-page-index={page.index}
              onClick={() => {
                setIsReaderChromeVisible((current) => !current);
              }}
              className="relative min-h-[40vh] bg-[#151018] sm:min-h-[60vh]"
            >
              {renderPage(page.index, page.url)}
            </div>
          ))
        )}
      </div>
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
              <div className="flex items-center rounded-2xl bg-white/5 p-1">
                <Button
                  type={readerMode === 'scroll' ? 'primary' : 'text'}
                  className={readerMode === 'scroll' ? '' : '!text-white'}
                  onClick={() => handleReaderModeChange('scroll')}
                >
                  Лента
                </Button>
                <Button
                  type={readerMode === 'paged' ? 'primary' : 'text'}
                  className={readerMode === 'paged' ? '' : '!text-white'}
                  onClick={() => handleReaderModeChange('paged')}
                >
                  По страницам
                </Button>
              </div>

              {isPagedMode ? (
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-1">
                  <Button
                    type="text"
                    className="!text-white"
                    icon={<LeftOutlined />}
                    disabled={activePage <= 1}
                    onClick={() => handlePagedNavigation('prev')}
                  />
                  <div className="min-w-[170px] px-4 py-2 text-center text-sm font-medium text-white sm:text-base">
                    Страница {activePage} / {data.chapter.pageCount}
                  </div>
                  <Button
                    type="text"
                    className="!text-white"
                    icon={<ArrowRightOutlined />}
                    disabled={activePage >= data.chapter.pageCount}
                    onClick={() => handlePagedNavigation('next')}
                  />
                </div>
              ) : (
                <Text className="text-white/80" style={{ fontSize: screens.md ? undefined : 15 }}>
                  Страница {activePage} из {data.chapter.pageCount}
                </Text>
              )}
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
            </Flex>
          </Flex>
        </div>

        {!isPreview && isReaderChromeVisible ? (
          <FloatButton.Group
            shape="square"
            style={{
              insetInlineEnd: screens.md ? 24 : 12,
              bottom: screens.md ? 112 : 104,
            }}
          >
            <FloatButton
              icon={isPagedMode ? <LeftOutlined /> : <UpOutlined />}
              tooltip="В начало"
              onClick={() => {
                if (isPagedMode) return setActivePage(1);
                else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />
            {!isDraft && (
              <>
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
                  icon={data.isFavorite ? <StarFilled /> : <StarOutlined />}
                  tooltip="Избранное"
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
                />
              </>
            )}
          </FloatButton.Group>
        ) : null}
      </>
    </div>
  );
};
