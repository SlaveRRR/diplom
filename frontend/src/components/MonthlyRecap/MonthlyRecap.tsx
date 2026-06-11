import '@react-instastories/base/index.css';
import '@react-instastories/external/index.css';

import { Button, Card, Col, Empty, Row, Skeleton, Space, Statistic, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, ArrowRightOutlined, LeftOutlined, RightOutlined, TrophyOutlined } from '@ant-design/icons';
import { Configurable, InstaStories, Page, Pages, Preview, Stories, Story } from '@react-instastories/base';
import { Controls, Events, Preloadable } from '@react-instastories/external';
import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { UserMonthlyRecapResponse } from '@types';

import { MONTHLY_RECAP_QUERY_KEY, recapStatisticCards } from './constants';

const { Paragraph, Text, Title } = Typography;

const getMonthLabel = (year: number, month: number) => {
  const date = new Date(year, month - 1, 1);
  const monthName = date.toLocaleDateString('ru-RU', { month: 'long' });
  return `${monthName} ${year}`;
};

const shiftMonth = (year: number, month: number, delta: number) => {
  const nextDate = new Date(year, month - 1 + delta, 1);

  return {
    year: nextDate.getFullYear(),
    month: nextDate.getMonth() + 1,
  };
};

const buildStatisticRows = (recap: UserMonthlyRecapResponse) => {
  const firstRow = recapStatisticCards.slice(0, 4);
  const secondRow = recapStatisticCards.slice(4);

  return [firstRow, secondRow].map((row) =>
    row.map((card) => ({
      ...card,
      value: recap.summary[card.key],
    })),
  );
};

const hasMeaningfulRecapData = (recap: UserMonthlyRecapResponse) =>
  Object.values(recap.summary).some((value) => value > 0) ||
  Boolean(recap.topComic) ||
  Boolean(recap.topPost) ||
  recap.topGenres.length > 0 ||
  recap.topTags.length > 0 ||
  recap.achievementsUnlocked.length > 0;

const StoryFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="recap-story-shell">
    <Card className="recap-story-card">{children}</Card>
  </div>
);

export const MonthlyRecap = () => {
  const today = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [MONTHLY_RECAP_QUERY_KEY, selectedPeriod.year, selectedPeriod.month],
    queryFn: async () => {
      const response = await api.getUserMonthlyRecap(selectedPeriod);
      return response.data.data;
    },
  });

  const recap = data as UserMonthlyRecapResponse | undefined;
  const monthLabel = useMemo(
    () => getMonthLabel(selectedPeriod.year, selectedPeriod.month),
    [selectedPeriod.month, selectedPeriod.year],
  );
  const isCurrentMonth = selectedPeriod.year === today.getFullYear() && selectedPeriod.month === today.getMonth() + 1;
  const shouldRenderRecapViewer = recap ? isCurrentMonth || hasMeaningfulRecapData(recap) : false;

  const handleMonthChange = (delta: number) => {
    setSelectedPeriod((prev) => shiftMonth(prev.year, prev.month, delta));
  };

  const statisticRows = recap ? buildStatisticRows(recap) : [];

  useEffect(() => {
    return () => {
      window.dispatchEvent(
        new CustomEvent('recap-viewer-visibility-change', {
          detail: { isOpen: false },
        }),
      );
    };
  }, []);

  const handleStoryOpen = () => {
    window.dispatchEvent(
      new CustomEvent('recap-viewer-visibility-change', {
        detail: { isOpen: true },
      }),
    );
  };

  const handleStoryClose = () => {
    window.dispatchEvent(
      new CustomEvent('recap-viewer-visibility-change', {
        detail: { isOpen: false },
      }),
    );
  };

  return (
    <Space direction="vertical" size={24} className="flex w-full">
      <style>{`
      .instastories-story{
       overflow:visible !important;
      }

  .instastories-stories{
  justify-content:center;
  }
        .recap-preview-card {
          position: relative;
          overflow: hidden;
          width: 280px;
          min-height: 220px;
          border-radius: 26px;
          padding: 22px;
          color: #ffffff;
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
        }

        .recap-preview-card--violet {
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.16), transparent 24%),
            linear-gradient(145deg, #201547 0%, #5140a8 48%, #2a8c99 100%);
        }

        .recap-preview-card--sunset {
          background:
            radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.16), transparent 24%),
            linear-gradient(145deg, #5f1536 0%, #c04b56 46%, #f59e0b 100%);
        }

        .recap-preview-card--mint {
          background:
            radial-gradient(circle at top left, rgba(255, 255, 255, 0.14), transparent 26%),
            linear-gradient(145deg, #15324a 0%, #196b73 45%, #52b788 100%);
        }

        .recap-preview-card--ocean {
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.16), transparent 24%),
            linear-gradient(145deg, #13203f 0%, #2457a6 50%, #4cc9f0 100%);
        }

        .recap-preview-card::before {
          content: '';
          position: absolute;
          inset: auto -48px -72px auto;
          width: 180px;
          height: 180px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          filter: blur(24px);
        }

        .recap-preview-card::after {
          content: '';
          position: absolute;
          inset: -64px auto auto -40px;
          width: 150px;
          height: 150px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          filter: blur(20px);
        }

        .recap-preview-content {
          position: relative;
          display: flex;
          min-height: 176px;
          flex-direction: column;
          justify-content: flex-end;
        }

        .recap-preview-title {
          margin-bottom: 0 !important;
          color: #ffffff !important;
          font-size: 54px !important;
          line-height: 0.95 !important;
        }

        .recap-story-nav {
          position: fixed;
          top: 50%;
          z-index: 40;
          display: inline-flex;
          height: 72px;
          width: 72px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          backdrop-filter: blur(14px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
          transform: translateY(-50%);
          transition: background-color 0.2s ease, opacity 0.2s ease;
        }

        .recap-story-nav:hover {
          background: rgba(255, 255, 255, 0.18);
        }

      

       

        .recap-story-nav-icon {
          font-size: 34px;
          line-height: 1;
        }

        .recap-story-shell {
          display: flex;
          min-height: 100%;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 45%, #111827 100%);
          color: #ffffff;
        }

        .recap-story-card {
          width: 100%;
          max-width: 760px;
          overflow: hidden;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
        }

        .recap-story-card > .ant-card-body,
        .recap-story-page-card .ant-card-body {
          padding: 24px;
        }

        .recap-stat-card {
          overflow: hidden;
        }

        .recap-stat-card .ant-card-body {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: space-between;
        }

        .recap-stat-card .ant-statistic {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .recap-stat-card .ant-statistic-content {
          margin-top: 12px;
          font-size: 40px;
          line-height: 1;
        }

        .recap-stat-card .ant-statistic-title {
          margin-bottom: 0;
          font-size: 16px;
          line-height: 1.35;
          color: rgba(15, 23, 42, 0.68);
          text-wrap: balance;
        }

        .recap-spotlight-card .ant-card-head-title {
          overflow: visible;
          white-space: normal;
          text-overflow: unset;
          line-height: 1.25;
        }

        .recap-spotlight-card .ant-empty-description {
          max-width: 280px;
          margin-inline: auto;
          line-height: 1.5;
          text-wrap: balance;
        }

        .recap-stat-card--chaptersRead .ant-card-body {
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          border-radius: 24px;
        }

        .recap-stat-card--comicsStarted .ant-card-body {
          background: linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 100%);
          border-radius: 24px;
        }

        .recap-stat-card--comicsFinished .ant-card-body {
          background: linear-gradient(135deg, #ede9fe 0%, #faf5ff 100%);
          border-radius: 24px;
        }

        .recap-stat-card--readingDays .ant-card-body {
          background: linear-gradient(135deg, #fed7aa 0%, #fff7ed 100%);
          border-radius: 24px;
        }

        .recap-stat-card--favoritesAdded .ant-card-body {
          background: linear-gradient(135deg, #fbcfe8 0%, #fdf2f8 100%);
          border-radius: 24px;
        }

        .recap-stat-card--commentsWritten .ant-card-body {
          background: linear-gradient(135deg, #bfdbfe 0%, #dbeafe 100%);
          border-radius: 24px;
        }

        .recap-stat-card--achievementsUnlocked .ant-card-body {
          background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
          border-radius: 24px;
        }

        .recap-stat-card--publications .ant-card-body {
          background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
          border-radius: 24px;
        }

        .recap-stat-card--chaptersRead .ant-statistic-content {
          color: #2563eb;
        }

        .recap-stat-card--comicsStarted .ant-statistic-content {
          color: #0f766e;
        }

        .recap-stat-card--comicsFinished .ant-statistic-content {
          color: #7c3aed;
        }

        .recap-stat-card--readingDays .ant-statistic-content {
          color: #ea580c;
        }

        .recap-stat-card--favoritesAdded .ant-statistic-content {
          color: #db2777;
        }

        .recap-stat-card--commentsWritten .ant-statistic-content {
          color: #1d4ed8;
        }

        .recap-stat-card--achievementsUnlocked .ant-statistic-content {
          color: #ca8a04;
        }

        .recap-stat-card--publications .ant-statistic-content {
          color: #15803d;
        }

        @media (max-width: 767px) {
          .recap-preview-card {
            width: 220px;
            min-height: 180px;
            padding: 18px;
          }

          .recap-preview-content {
            min-height: 144px;
          }

          .recap-preview-title {
            font-size: 34px !important;
          }

          .recap-story-nav {
            top: 0;
            bottom: 0;
            height: auto;
            width: 50vw;
            transform: none;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            backdrop-filter: none;
          }

          .recap-story-nav:hover {
            background: transparent;
          }

          .recap-story-nav--prev {
            left: 0;
          }

          .recap-story-nav--next {
            right: 0;
          }

          .recap-story-nav-icon {
            opacity: 0;
          }

          .recap-story-shell {
            padding: 14px;
          }

          .recap-story-card {
            border-radius: 22px;
          }

          .recap-story-card > .ant-card-body,
          .recap-story-page-card .ant-card-body {
            padding: 18px;
          }

          .recap-stat-card .ant-card-body {
            padding: 18px;
          }

          .recap-stat-card .ant-statistic-content {
            margin-top: 10px;
            font-size: 32px;
          }

          .recap-stat-card .ant-statistic-title {
            font-size: 14px;
            line-height: 1.3;
          }

          .recap-spotlight-card .ant-card-head {
            min-height: auto;
            padding: 0 16px;
          }

          .recap-spotlight-card .ant-card-head-title {
            padding: 14px 0;
            font-size: 16px;
          }

          .recap-spotlight-card .ant-card-body {
            padding: 16px;
          }

          .recap-spotlight-card .ant-empty {
            margin-block: 8px 0;
          }
        }

        @media (min-width: 768px) {
          .recap-story-nav--prev {
            box-shadow: none !important;
          backdrop-filter: none !important;
            top: 50% !important;
            left: -50px !important;
          }

          .recap-story-nav--next {
          box-shadow: none !important;
          backdrop-filter: none !important;
            top: 50% !important;
            right: -50px !important;
          }
        }
      `}</style>

      <Card className="mx-auto w-full max-w-6xl rounded-[28px] shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Space size="small" className="mb-3">
              {recap ? (
                <Tag color={recap.isFinalized ? 'green' : 'blue'} className="rounded-full px-3 py-1 text-sm">
                  {recap.isFinalized ? 'Зафиксировано' : 'Обновляется'}
                </Tag>
              ) : null}
            </Space>

            <Title level={2} className="!mb-2">
              {monthLabel}
            </Title>
            <Paragraph className="!mb-0 max-w-2xl text-[16px] text-[var(--color-text-secondary)]">
              Итог месяца.
            </Paragraph>
          </div>

          <div className="flex items-center gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={() => handleMonthChange(-1)}>
              Назад
            </Button>
            <Button icon={<ArrowRightOutlined />} onClick={() => handleMonthChange(1)} disabled={isCurrentMonth}>
              Вперед
            </Button>
          </div>
        </div>
      </Card>

      {isError ? (
        <Card className="mx-auto w-full max-w-6xl rounded-[28px] shadow-sm">
          <Empty description="Не удалось загрузить за выбранный месяц." />
        </Card>
      ) : isLoading || !recap ? (
        <Card className="mx-auto w-full max-w-6xl rounded-[28px] shadow-sm">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      ) : shouldRenderRecapViewer ? (
        <Card className="mx-auto w-full max-w-6xl rounded-[28px] shadow-sm">
          <InstaStories>
            <Configurable.Container>
              <Configurable.Viewer
                events={[
                  Events.Mount.Interactive,
                  Events.Focus.Timer,
                  Events.Keyboard.Close,
                  Events.Keyboard.Pages,
                  Events.Pointer.Timer,
                ]}
              >
                <Controls.Viewer.Background />
                <Controls.Viewer.Close />
                <Preloadable.Pages unloadable next={1} previous={1} />
              </Configurable.Viewer>

              <Configurable.Story>
                <Controls.Indicator interactive />
                <Controls.Pages.Previous
                  aria-label="Предыдущая карточка recap"
                  className="recap-story-nav recap-story-nav--prev"
                >
                  <LeftOutlined className="recap-story-nav-icon" />
                </Controls.Pages.Previous>
                <Controls.Pages.Next
                  aria-label="Следующая карточка recap"
                  className="recap-story-nav recap-story-nav--next"
                >
                  <RightOutlined className="recap-story-nav-icon" />
                </Controls.Pages.Next>
              </Configurable.Story>
            </Configurable.Container>

            <Stories>
              <Story duration={7000} onOpen={handleStoryOpen} onClose={handleStoryClose}>
                <Preview
                  as="div"
                  style={{
                    width: 220,
                    height: 300,
                    background: 'linear-gradient(135deg, #7254E6 0%, #5E63F3 45%, #2E90FA 100%)',
                    boxShadow: '0 20px 40px rgba(114,84,230,0.25)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Typography.Text strong className="recap-preview-title text-center">
                    Итоги месяца
                  </Typography.Text>
                </Preview>

                <Pages>
                  <Page duration={7000}>
                    <StoryFrame>
                      <Space direction="vertical" size={20} className="flex">
                        <div>
                          <Tag color="blue" className="rounded-full px-3 py-1 text-sm">
                            Обзор месяца
                          </Tag>
                          <Title level={2} className="!mb-1 !mt-4 max-sm:!text-[28px]">
                            {monthLabel}
                          </Title>
                          <Paragraph className="!mb-0 text-[16px] leading-7 text-[var(--color-text-secondary)] max-sm:!text-sm max-sm:leading-6">
                            Итоги по чтению и привычкам за месяц.
                          </Paragraph>
                        </div>

                        <Row gutter={[16, 16]}>
                          {statisticRows[0]?.map((card) => (
                            <Col key={card.key} xs={12} md={12}>
                              <Card
                                className={`recap-story-page-card recap-stat-card h-full rounded-[24px] border-black/8 ${card.className}`}
                              >
                                <Statistic title={card.title} value={card.value} />
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Space>
                    </StoryFrame>
                  </Page>

                  <Page duration={7000}>
                    <StoryFrame>
                      <Space direction="vertical" size={20} className="flex">
                        <div>
                          <Tag color="purple" className="rounded-full px-3 py-1 text-sm">
                            Активность
                          </Tag>
                          <Title level={2} className="!mb-1 !mt-4 max-sm:!text-[28px]">
                            Коллекция, общение и публикации
                          </Title>
                        </div>

                        <Row gutter={[16, 16]}>
                          {statisticRows[1]?.map((card) => (
                            <Col key={card.key} xs={12} md={12}>
                              <Card
                                className={`recap-story-page-card recap-stat-card h-full rounded-[24px] border-black/8 ${card.className}`}
                              >
                                <Statistic title={card.title} value={card.value} />
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Space>
                    </StoryFrame>
                  </Page>

                  <Page duration={7000}>
                    <StoryFrame>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={24} lg={12}>
                          <Card
                            className="recap-story-page-card recap-spotlight-card h-full rounded-[24px] border-black/8"
                            title="Главный комикс месяца"
                          >
                            {recap.topComic ? (
                              <Space direction="vertical" size={14} className="flex">
                                <div>
                                  <Title level={3} className="!mb-1 max-sm:!text-[24px]">
                                    {recap.topComic.title}
                                  </Title>
                                  {recap.topComic.genre ? <Tag color="geekblue">{recap.topComic.genre}</Tag> : null}
                                </div>
                                <Statistic
                                  title="Прочитано глав"
                                  value={recap.topComic.chaptersRead}
                                  prefix={<TrophyOutlined />}
                                />
                              </Space>
                            ) : (
                              <Empty description="В этом месяце еще нет прочитанных комиксов." />
                            )}
                          </Card>
                        </Col>
                        <Col xs={24} md={24} lg={12}>
                          <Card
                            className="recap-story-page-card recap-spotlight-card h-full rounded-[24px] border-black/8"
                            title="Последний важный пост месяца"
                          >
                            {recap.topPost ? (
                              <Space direction="vertical" size={14} className="flex">
                                <Title level={3} className="!mb-0 max-sm:!text-[24px]">
                                  {recap.topPost.title}
                                </Title>
                                <Statistic title="Попаданий в reading history" value={recap.topPost.reads} />
                              </Space>
                            ) : (
                              <Empty description="В этом месяце вы еще не читали посты блога." />
                            )}
                          </Card>
                        </Col>
                      </Row>
                    </StoryFrame>
                  </Page>

                  <Page duration={7000}>
                    <StoryFrame>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={24} lg={12}>
                          <Card
                            className="recap-story-page-card recap-spotlight-card h-full rounded-[24px] border-black/8"
                            title="Любимые жанры месяца"
                          >
                            {recap.topGenres.length ? (
                              <Space wrap size={[10, 10]}>
                                {recap.topGenres.map((genre) => (
                                  <Tag key={genre.name} color="geekblue" className="rounded-full px-3 py-2 text-sm">
                                    {genre.name} · {genre.value}
                                  </Tag>
                                ))}
                              </Space>
                            ) : (
                              <Empty description="Жанры появятся после чтения в этом месяце." />
                            )}
                          </Card>
                        </Col>
                        <Col xs={24} md={24} lg={12}>
                          <Card
                            className="recap-story-page-card recap-spotlight-card h-full rounded-[24px] border-black/8"
                            title="Темы и теги месяца"
                          >
                            {recap.topTags.length ? (
                              <Space wrap size={[10, 10]}>
                                {recap.topTags.map((tag) => (
                                  <Tag key={tag.name} color="purple" className="rounded-full px-3 py-2 text-sm">
                                    #{tag.name} · {tag.value}
                                  </Tag>
                                ))}
                              </Space>
                            ) : (
                              <Empty description="Теги появятся после чтения комиксов в этом месяце." />
                            )}
                          </Card>
                        </Col>
                      </Row>
                    </StoryFrame>
                  </Page>

                  <Page duration={7000}>
                    <StoryFrame>
                      <Space direction="vertical" size={18} className="flex">
                        <div>
                          <Tag color="gold" className="rounded-full px-3 py-1 text-sm">
                            Достижения
                          </Tag>
                          <Title level={2} className="!mb-1 !mt-4 max-sm:!text-[28px]">
                            Что открылось в этом месяце
                          </Title>
                        </div>

                        {recap.achievementsUnlocked.length ? (
                          <Space direction="vertical" size={12} className="flex">
                            {recap.achievementsUnlocked.map((achievement) => (
                              <Card
                                key={achievement.code}
                                className="recap-story-page-card rounded-[20px] border-black/8 bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_100%)]"
                              >
                                <Space direction="vertical" size={4} className="flex">
                                  <Text strong>{achievement.title}</Text>
                                  <Text type="secondary">
                                    {new Date(achievement.awardedAt).toLocaleDateString('ru-RU')}
                                  </Text>
                                </Space>
                              </Card>
                            ))}
                          </Space>
                        ) : (
                          <Empty description="В этом месяце новые достижения пока не открывались." />
                        )}
                      </Space>
                    </StoryFrame>
                  </Page>
                </Pages>
              </Story>
            </Stories>
          </InstaStories>
        </Card>
      ) : (
        <Card className="mx-auto w-full max-w-6xl rounded-[28px] shadow-sm">
          <Empty description="Нет данных за выбранный месяц." />
        </Card>
      )}
    </Space>
  );
};
