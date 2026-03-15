import { Button, Card, Flex, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { colors } from '@constants';

import type {
  CategoryCardStyledProps,
  CategoryMediaStyledProps,
  ShortcutCardStyledProps,
  ShowcaseBadgeStyledProps,
  ShowcaseCoverStyledProps,
  SlideInnerStyledProps,
} from './types';

const { Title, Paragraph, Text } = Typography;

const space = (step: number) => `${step * 4}px`;

export const PageRoot = styled(Flex)({
  flexDirection: 'column',
  gap: space(8),
  paddingTop: space(2),
  paddingBottom: space(10),
});

export const HeroShell = styled.section({
  display: 'grid',
  gap: space(6),
  gridTemplateColumns: 'minmax(0, 1.08fr) minmax(340px, 0.92fr)',
  alignItems: 'start',
  '@media (max-width: 991px)': {
    gridTemplateColumns: '1fr',
  },
});

export const HeroCopy = styled(Flex)({
  flexDirection: 'column',
  gap: space(5),
});

export const HeroBadge = styled(Tag)({
  alignSelf: 'flex-start',
  margin: 0,
  paddingInline: space(3),
  paddingBlock: space(1),
  borderRadius: 999,
  background: colors.surface.brandSubtle,
  color: colors.brand.primary,
  border: `1px solid ${colors.border.subtle}`,
  fontWeight: 600,
});

export const HeroTitle = styled(Title)({
  margin: 0,
  maxWidth: 680,
  fontSize: 'var(--font-h1)',
  lineHeight: 'var(--line-tight)',
  letterSpacing: '-0.035em',
  textWrap: 'balance',
});

export const HeroDescription = styled(Paragraph)({
  margin: 0,
  maxWidth: 620,
  color: colors.text.secondary,
  fontSize: 'var(--font-body)',
  lineHeight: 'var(--line-body)',
});

export const HeroActions = styled(Flex)({
  flexWrap: 'wrap',
  gap: space(3),
});

export const PrimaryAction = styled(Button)({
  height: 48,
  paddingInline: space(5),
  fontWeight: 600,
});

export const SecondaryAction = styled(Button)({
  height: 48,
  paddingInline: space(5),
  fontWeight: 600,
});

export const SectionBlock = styled(Flex)({
  flexDirection: 'column',
  gap: space(5),
});

export const SectionHeader = styled(Flex)({
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: space(4),
  '@media (max-width: 767px)': {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
});

export const SectionTitleGroup = styled(Flex)({
  flexDirection: 'column',
  gap: space(2),
});

export const SectionEyebrow = styled(Text)({
  color: colors.brand.secondary,
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

export const SectionTitle = styled(Title)({
  margin: 0,
  fontSize: 'var(--font-h2)',
  lineHeight: 'calc(var(--line-tight) + 0.05)',
  letterSpacing: '-0.03em',
});

export const SectionDescription = styled(Paragraph)({
  margin: 0,
  maxWidth: 640,
  color: colors.text.secondary,
});

export const CarouselFrame = styled(Card)({
  overflow: 'hidden',
  borderRadius: 20,
  border: `1px solid ${colors.border.subtle}`,
  background: colors.surface.elevated,
  boxShadow: '0 18px 40px rgba(32, 20, 82, 0.08)',
  '& .ant-card-body': {
    padding: 0,
  },
});

export const CardLink = styled(Link)({
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
});

export const SlideInner = styled(Flex)<SlideInnerStyledProps>(({ $image }) => ({
  minHeight: 420,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  background:
    `linear-gradient(135deg, ${colors.overlay.darkStrong} 0%, ${colors.overlay.brandDeep} 48%, ${colors.overlay.infoGlow} 100%),` +
    `url(${$image})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  '@media (max-width: 991px)': {
    minHeight: 380,
  },
  '@media (max-width: 575px)': {
    minHeight: 340,
  },
}));

export const SlideCopy = styled(Flex)({
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: space(6),
  padding: space(8),
  color: colors.text.inverse,
  '@media (max-width: 767px)': {
    padding: space(5),
  },
});

export const SlideTextGroup = styled(Flex)({
  flexDirection: 'column',
  gap: space(4),
});

export const SlideMeta = styled(Flex)({
  flexWrap: 'wrap',
  gap: space(2),
});

export const SlideTag = styled(Tag)({
  margin: 0,
  border: 'none',
  borderRadius: 999,
  paddingInline: space(3),
  paddingBlock: space(1),
  background: colors.overlay.glassStrong,
  color: colors.text.inverse,
  fontWeight: 600,
});

export const SlideTitle = styled(Title)({
  margin: 0,
  color: colors.text.inverse,
  fontSize: 'clamp(2rem, 1.7rem + 1.3vw, 3.3rem)',
  lineHeight: 1.02,
  letterSpacing: '-0.045em',
  textWrap: 'balance',
});

export const SlideDescription = styled(Paragraph)({
  margin: 0,
  maxWidth: 580,
  color: colors.overlay.textOnImage,
  fontSize: '1rem',
  lineHeight: 1.65,
});

export const SlideAside = styled(Flex)({
  alignItems: 'flex-end',
  justifyContent: 'flex-end',
  padding: `0 ${space(8)} ${space(8)}`,
  '@media (max-width: 767px)': {
    padding: `0 ${space(5)} ${space(5)}`,
  },
});

export const SlideQuote = styled(Card)({
  width: '100%',
  maxWidth: 320,
  borderRadius: 18,
  background: colors.overlay.glassSoft,
  border: `1px solid ${colors.overlay.glassStrong}`,
  backdropFilter: 'blur(14px)',
  '& .ant-card-body': {
    display: 'flex',
    flexDirection: 'column',
    gap: space(3),
    padding: space(5),
  },
});

export const QuoteText = styled(Paragraph)({
  margin: 0,
  color: colors.text.inverse,
  fontSize: '1rem',
  lineHeight: 1.6,
});

export const QuoteMeta = styled(Text)({
  color: colors.overlay.textOnImageSoft,
  fontSize: '0.8125rem',
});

export const CategoryCard = styled(Card)<CategoryCardStyledProps>(({ $height }) => ({
  position: 'relative',
  minHeight: $height,
  borderRadius: 18,
  overflow: 'hidden',
  border: 'none',
  boxShadow: '0 20px 40px rgba(32, 20, 82, 0.08)',
  cursor: 'pointer',
  transform: 'translateY(0)',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 24px 46px rgba(32, 20, 82, 0.14)',
  },
  '&:hover .home-category-media': {
    transform: 'scale(1.06)',
  },
  '& .ant-card-body': {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    minHeight: $height,
    padding: space(5),
  },
}));

export const CategoryMedia = styled.div<CategoryMediaStyledProps>(({ $image }) => ({
  position: 'absolute',
  inset: 0,
  backgroundImage:
    `linear-gradient(180deg, ${colors.overlay.darkSubtle} 0%, ${colors.overlay.darkSoft} 100%),` + `url(${$image})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  transform: 'scale(1)',
  transition: 'transform 0.35s ease',
}));

export const CategoryTitle = styled(Title)({
  margin: 0,
  color: colors.text.inverse,
  fontSize: 'clamp(1.4rem, 1.15rem + 0.9vw, 2.2rem)',
  lineHeight: 1,
  letterSpacing: '-0.04em',
  textTransform: 'uppercase',
});

export const ShowcasePanel = styled(Card)({
  height: '100%',
  borderRadius: 18,
  border: `1px solid ${colors.border.subtle}`,
  background: colors.surface.elevated,
  boxShadow: '0 14px 30px rgba(32, 20, 82, 0.06)',
  '& .ant-card-body': {
    display: 'flex',
    flexDirection: 'column',
    gap: space(4),
    padding: space(5),
  },
});

export const ShowcaseHeading = styled(Flex)({
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: space(3),
});

export const ShowcaseTitle = styled(Title)({
  margin: 0,
  fontSize: '1.35rem',
  lineHeight: 1.1,
  letterSpacing: '-0.03em',
});

export const ShowcaseBadge = styled(Tag)<ShowcaseBadgeStyledProps>(({ $background, $color }) => ({
  margin: 0,
  border: 'none',
  borderRadius: 999,
  background: $background,
  color: $color,
  paddingInline: space(3),
  paddingBlock: space(1),
  fontWeight: 600,
}));

export const ShowcaseCard = styled(Card)({
  borderRadius: 14,
  overflow: 'hidden',
  border: `1px solid ${colors.border.subtle}`,
  background: colors.surface.elevated,
  cursor: 'pointer',
  transform: 'translateY(0)',
  transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 18px 34px rgba(32, 20, 82, 0.10)',
    borderColor: colors.border.default,
  },
  '&:hover .home-showcase-cover': {
    transform: 'scale(1.06)',
  },
  '& .ant-card-cover': {
    height: 180,
    overflow: 'hidden',
  },
  '& .ant-card-body': {
    display: 'flex',
    flexDirection: 'column',
    gap: space(2),
    padding: space(4),
  },
});

export const ShowcaseCover = styled.div<ShowcaseCoverStyledProps>(({ $image }) => ({
  width: '100%',
  height: '100%',
  backgroundImage:
    `linear-gradient(180deg, ${colors.overlay.darkSubtle} 0%, ${colors.overlay.brandDeep} 100%),` + `url(${$image})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  transform: 'scale(1)',
  transition: 'transform 0.35s ease',
}));

export const ShowcaseCardTitle = styled(Title)({
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.15,
  letterSpacing: '-0.02em',
});

export const ShowcaseCardMeta = styled(Text)({
  color: colors.text.muted,
  fontSize: 'var(--font-body-sm)',
});

export const ShortcutCard = styled(Card)<ShortcutCardStyledProps>(({ $accent }) => ({
  height: '100%',
  borderRadius: 16,
  border: `1px solid ${colors.border.subtle}`,
  background: colors.surface.elevated,
  boxShadow: '0 12px 26px rgba(32, 20, 82, 0.06)',
  transform: 'translateY(0)',
  transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 18px 34px rgba(32, 20, 82, 0.10)',
    borderColor: colors.border.default,
  },
  '& .ant-card-body': {
    display: 'flex',
    flexDirection: 'column',
    gap: space(4),
    height: '100%',
    padding: space(5),
  },
  '&::before': {
    content: '""',
    display: 'block',
    width: 56,
    height: 4,
    borderRadius: 999,
    background: $accent,
  },
}));

export const ShortcutIconWrap = styled(Flex)<{
  $background: string;
  $color: string;
}>(({ $background, $color }) => ({
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: 14,
  background: $background,
  color: $color,
  fontSize: 20,
}));

export const ShortcutTextGroup = styled(Flex)({
  flexDirection: 'column',
  gap: space(2),
});

export const ShortcutTitle = styled(Title)({
  margin: 0,
  fontSize: '1.1rem',
  lineHeight: 1.15,
  letterSpacing: '-0.025em',
});

export const ShortcutText = styled(Paragraph)({
  margin: 0,
  color: colors.text.secondary,
  lineHeight: 1.55,
});

export const ShortcutFooter = styled(Flex)({
  marginTop: 'auto',
});
