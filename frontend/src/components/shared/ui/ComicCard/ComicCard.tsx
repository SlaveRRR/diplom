import { Badge, Button, Card, Rate, Skeleton, Space, Tag, theme, Typography } from 'antd';
import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { colors } from '@constants';
import { useAdultContentGate } from '@hooks';
import { CatalogItem } from '@components/Catalog/hooks/useCatalogStore/types';

const { Paragraph, Text } = Typography;

const statusLabels: Record<CatalogItem['status'], string> = {
  draft: 'Черновик',
  under_review: 'На модерации',
  published: 'Опубликован',
  blocked: 'Заблокирован',
  revision: 'На доработке',
};

const statusColors: Record<CatalogItem['status'], string> = {
  draft: 'default',
  under_review: 'processing',
  published: 'success',
  blocked: 'error',
  revision: 'warning',
};

type ComicCardProps = {
  item: CatalogItem;
  action?: ReactNode;
  background?: string;
  badgeColor?: string;
  badgeText?: string;
  href?: string;
  showAuthor?: boolean;
  showStatus?: boolean;
};

const isAdultContent = (ageRating: string) => ageRating === '18+';

export const ComicCard = ({
  item,
  action,
  background,
  badgeColor,
  badgeText,
  href = `/comics/${item.id}`,
  showAuthor = true,
  showStatus = true,
}: ComicCardProps) => {
  const {
    token: { borderRadius, borderRadiusLG, colorBgContainer },
  } = theme.useToken();
  const { guardNavigation, adultContentModal, isAdultContentConfirmed } = useAdultContentGate();
  const isAdult = isAdultContent(item.ageRating) && !isAdultContentConfirmed;

  const handleProtectedLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    guardNavigation({ href, ageRating: item.ageRating }, event);
  };

  const card = (
    <Link to={href} onClick={handleProtectedLinkClick}>
      <Card
        hoverable
        style={{ borderRadius: borderRadiusLG, overflow: 'hidden', background: background || colorBgContainer }}
        cover={
          <div
            style={{
              padding: 12,
              background: `linear-gradient(135deg, ${colors.surface.infoSubtle}, ${colors.surface.brandSubtle})`,
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius,
                overflow: 'hidden',
                height: 220,
                backgroundImage: `url(${item.coverUrl || item.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {isAdult ? (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(32, 20, 82, 0.58) 100%)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div className="flex max-w-[190px] flex-col items-center gap-2.5 px-4 text-center text-white">
                    <div className="rounded-[16px] bg-[rgba(255,255,255,0.14)] px-3 py-1.5 text-sm font-semibold tracking-[0.08em] shadow-[0_8px_18px_rgba(32,20,82,0.18)] backdrop-blur-sm">
                      18+
                    </div>
                    <div className="text-sm font-medium leading-5 text-white/88">
                      Откроется после подтверждения возраста
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        }
      >
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Space align="baseline" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space direction="vertical" size={4}>
              <Text
                strong
                ellipsis
                style={{
                  fontSize: 'var(--font-card-title)',
                  lineHeight: 1.3,
                  letterSpacing: '-0.015em',
                }}
              >
                {item.title}
              </Text>

              {showAuthor ? (
                <Text type="secondary" style={{ fontSize: 'var(--font-body-sm)', lineHeight: 1.45 }}>
                  {item.author}
                </Text>
              ) : null}
            </Space>
            {action}
          </Space>

          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 0, minHeight: 44 }}>
            {item.description}
          </Paragraph>

          <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space size={4}>
              <Rate disabled allowHalf value={item.rating} style={{ fontSize: 14 }} />
              <Text type="secondary" style={{ fontSize: 'var(--font-body-sm)', lineHeight: 1.45 }}>
                ({item.reviews.toLocaleString('ru-RU')})
              </Text>
            </Space>
            {showStatus ? <Tag color={statusColors[item.status]}>{statusLabels[item.status]}</Tag> : null}
          </Space>

          <Space size={4} wrap>
            <Tag color={isAdult ? 'volcano' : 'default'}>{item.ageRating}</Tag>
            {item.genre ? <Tag color={colors.brand.primary}>{item.genre}</Tag> : null}
            {item.tags.slice(0, 2).map((tagName) => (
              <Tag key={tagName}>{tagName}</Tag>
            ))}
            {item.tags.length > 2 ? <Tag color="default">+{item.tags.length - 2}</Tag> : null}
          </Space>
        </Space>
      </Card>
    </Link>
  );

  if (!badgeText) {
    return (
      <>
        {card}
        {adultContentModal}
      </>
    );
  }

  return (
    <>
      <Badge.Ribbon text={badgeText} color={badgeColor || colors.brand.secondary}>
        {card}
      </Badge.Ribbon>
      {adultContentModal}
    </>
  );
};

export const ComicCardSkeleton = () => {
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  return (
    <Card
      style={{ borderRadius: borderRadiusLG, overflow: 'hidden' }}
      cover={
        <Skeleton.Image
          className="border-r w-full"
          active
          classNames={{
            content: `w-full h-[244px] rounded-[${borderRadiusLG}px]`,
          }}
        />
      }
    >
      <Skeleton active paragraph={{ rows: 3 }} />
    </Card>
  );
};

type ComicCardActionButtonProps = {
  children: ReactNode;
  danger?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  onClick: () => void | Promise<void>;
};

export const ComicCardActionButton = ({ children, danger, icon, loading, onClick }: ComicCardActionButtonProps) => (
  <Button danger={danger} icon={icon} loading={loading} onClick={() => void onClick()}>
    {children}
  </Button>
);
