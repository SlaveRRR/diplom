import { Alert, Card, Col, Progress, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { api } from '@api';
import { UserAchievementProgressItem } from '@types';

import { achievementMeta, sectionDescriptions, sectionOrder, USER_ACHIEVEMENTS_QUERY_KEY } from './constants';
import { AchievementCardMeta } from './types';

const { Paragraph, Text, Title } = Typography;

const buildStatus = (achievement: UserAchievementProgressItem) => {
  if (achievement.achieved) {
    return {
      label: 'Получено',
      color: 'success',
      cardOpacity: 1,
      grayscale: 'grayscale(0)',
    } as const;
  }

  if (achievement.currentValue > 0) {
    return {
      label: 'В процессе',
      color: 'processing',
      cardOpacity: 0.88,
      grayscale: 'grayscale(0.08)',
    } as const;
  }

  return {
    label: 'Закрыто',
    color: 'default',
    cardOpacity: 0.72,
    grayscale: 'grayscale(0.22)',
  } as const;
};

const getAchievementSortRank = (achievement: UserAchievementProgressItem) => {
  if (achievement.achieved) {
    return 0;
  }

  if (achievement.currentValue > 0) {
    return 1;
  }

  return 2;
};

const sortAchievements = (items: Array<UserAchievementProgressItem & AchievementCardMeta>) =>
  [...items].sort((left, right) => {
    const rankDiff = getAchievementSortRank(left) - getAchievementSortRank(right);
    if (rankDiff !== 0) {
      return rankDiff;
    }

    if (left.achieved && right.achieved) {
      return new Date(right.awardedAt ?? 0).getTime() - new Date(left.awardedAt ?? 0).getTime();
    }

    const leftPercent = left.target > 0 ? left.currentValue / left.target : 0;
    const rightPercent = right.target > 0 ? right.currentValue / right.target : 0;
    if (leftPercent !== rightPercent) {
      return rightPercent - leftPercent;
    }

    return left.title.localeCompare(right.title, 'ru');
  });

const isRecentlyAwarded = (awardedAt: string | null) => {
  if (!awardedAt) {
    return false;
  }

  const awardedDate = new Date(awardedAt);
  const diff = Date.now() - awardedDate.getTime();

  return diff >= 0 && diff <= 1000 * 60 * 60 * 24;
};

const renderSkeletonGrid = () => (
  <Row gutter={[20, 20]}>
    {Array.from({ length: 6 }).map((_, index) => (
      <Col key={index} xs={24} sm={12} xl={8}>
        <Card className="h-full rounded-[24px]">
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
      </Col>
    ))}
  </Row>
);

export const Achievements = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [USER_ACHIEVEMENTS_QUERY_KEY],
    queryFn: async () => {
      const response = await api.getUserAchievements();
      return response.data.data;
    },
  });

  const achievements = data?.achievements ?? [];
  const achievedCount = achievements.filter((item) => item.achieved).length;
  const inProgressCount = achievements.filter((item) => !item.achieved && item.currentValue > 0).length;
  const newlyUnlockedCodes = achievements
    .filter((item) => item.achieved && isRecentlyAwarded(item.awardedAt))
    .map((item) => item.code);

  const achievementsBySection = sectionOrder
    .map((section) => ({
      section,
      items: sortAchievements(
        achievementMeta
          .filter((meta) => meta.section === section)
          .map((meta) => {
            const achievement = achievements.find((item) => item.code === meta.code);

            return achievement
              ? {
                  ...achievement,
                  ...meta,
                }
              : null;
          })
          .filter(Boolean) as Array<UserAchievementProgressItem & AchievementCardMeta>,
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Space direction="vertical" size={24} className="flex w-full">
      <style>{`
        @keyframes achievement-float {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -7px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
      `}</style>

      <Card className="mx-auto w-full max-w-7xl rounded-[28px] shadow-sm">
        <Title level={2} className="!mb-2">
          Достижения
        </Title>
        <Paragraph className="!mb-0 max-w-3xl text-[16px] text-[var(--color-text-secondary)]">
          Собирайте достижения за чтение, коллекцию, активность и публикации. Каждое достижение открывается один раз и
          остается в профиле как отметка о пройденном пути.
        </Paragraph>

        <Row gutter={[16, 16]} className="mt-6">
          <Col xs={24} md={8}>
            <Card className="rounded-[24px] border-black/8 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] shadow-none">
              <Text type="secondary">Открыто достижений</Text>
              <Title level={2} className="!mb-0 !mt-2">
                {isLoading ? '—' : achievedCount}
              </Title>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="rounded-[24px] border-black/8 bg-[linear-gradient(135deg,#fefce8_0%,#fff7ed_100%)] shadow-none">
              <Text type="secondary">Сейчас в прогрессе</Text>
              <Title level={2} className="!mb-0 !mt-2">
                {isLoading ? '—' : inProgressCount}
              </Title>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="rounded-[24px] border-black/8 bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_100%)] shadow-none">
              <Text type="secondary">Самая длинная серия</Text>
              <Title level={2} className="!mb-0 !mt-2">
                {isLoading ? '—' : (data?.stats.longestReadingStreakDays ?? 0)}
              </Title>
            </Card>
          </Col>
        </Row>
      </Card>

      {isError ? (
        <Card className="mx-auto w-full max-w-7xl rounded-[28px] shadow-sm">
          <Alert
            type="error"
            showIcon
            message="Не удалось загрузить достижения"
            description="Данные о прогрессе временно недоступны. Попробуйте обновить страницу немного позже."
          />
        </Card>
      ) : isLoading || !data ? (
        <Card className="mx-auto w-full max-w-7xl rounded-[28px] shadow-sm">{renderSkeletonGrid()}</Card>
      ) : (
        achievementsBySection.map(({ section, items }) => (
          <Card key={section} className="mx-auto w-full max-w-7xl rounded-[28px] shadow-sm">
            <Title level={3} className="!mb-1">
              {section}
            </Title>
            <Paragraph className="!mb-5 text-[var(--color-text-secondary)]">{sectionDescriptions[section]}</Paragraph>

            <Row gutter={[20, 20]}>
              {items.map((achievement, index) => {
                const status = buildStatus(achievement);
                const progressPercent =
                  achievement.target > 0 ? Math.min((achievement.currentValue / achievement.target) * 100, 100) : 0;
                const isNew = newlyUnlockedCodes.includes(achievement.code);

                return (
                  <Col key={achievement.code} xs={24} sm={12} xl={8}>
                    <Card
                      hoverable
                      className="h-full overflow-hidden rounded-[24px] border-black/8 shadow-sm transition-transform duration-300"
                      bodyStyle={{ padding: 0 }}
                      style={{
                        opacity: status.cardOpacity,
                        filter: status.grayscale,
                        animation: `achievement-float ${5.6 + (index % 4) * 0.45}s ease-in-out infinite`,
                        animationDelay: `${index * 0.16}s`,
                        boxShadow: isNew ? `0 18px 48px ${achievement.accent}26` : undefined,
                        borderColor: isNew ? `${achievement.accent}55` : undefined,
                      }}
                    >
                      <div
                        className="relative h-44 overflow-hidden px-5 py-4"
                        style={{
                          background: achievement.background,
                          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        }}
                      >
                        <div
                          className="absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-35"
                          style={{ background: `${achievement.accent}24` }}
                        />
                        <div
                          className="absolute -bottom-8 left-4 h-24 w-24 rounded-full opacity-25"
                          style={{ background: `${achievement.accent}1a` }}
                        />

                        <div className="relative flex h-full flex-col justify-between">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                              <Tag bordered={false} className="rounded-full px-3 py-1 text-xs font-medium">
                                {achievement.hint}
                              </Tag>
                              <Tag
                                bordered={false}
                                color={status.color}
                                className="rounded-full px-3 py-1 text-xs font-medium"
                              >
                                {status.label}
                              </Tag>
                              {isNew ? (
                                <Tag
                                  bordered={false}
                                  className="rounded-full px-3 py-1 text-xs font-medium"
                                  style={{
                                    color: '#fff',
                                    background: achievement.accent,
                                  }}
                                >
                                  Новое
                                </Tag>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-end justify-between gap-4">
                            <div className="max-w-[65%]">
                              <Title
                                level={4}
                                className="!mb-1 !text-[24px] !leading-tight"
                                style={{ color: achievement.accent }}
                              >
                                {achievement.title}
                              </Title>
                            </div>
                            <div className="select-none text-[64px] leading-none drop-shadow-sm">{achievement.art}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-5">
                        <Paragraph className="!mb-0 min-h-[72px] text-[15px] text-[var(--color-text-secondary)]">
                          {achievement.description}
                        </Paragraph>

                        <div>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <Text type="secondary">Прогресс</Text>
                            <Text strong>
                              {Math.min(achievement.currentValue, achievement.target)} / {achievement.target}
                            </Text>
                          </div>
                          <Progress
                            percent={progressPercent}
                            showInfo={false}
                            strokeColor={achievement.accent}
                            trailColor="rgba(15, 23, 42, 0.08)"
                            size={[999, 8]}
                          />
                        </div>

                        {achievement.awardedAt ? (
                          <Text type="secondary">
                            Получено: {new Date(achievement.awardedAt).toLocaleDateString('ru-RU')}
                          </Text>
                        ) : (
                          <Text type="secondary">Откроется после достижения нужного порога.</Text>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        ))
      )}
    </Space>
  );
};
