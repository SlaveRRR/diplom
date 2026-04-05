import { Button, Carousel, Col, Masonry, Row } from 'antd';
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightOutlined, CompassOutlined, EditOutlined, LoginOutlined, ReadOutlined } from '@ant-design/icons';

import { colors } from '@constants';

import {
  CardLink,
  CarouselFrame,
  CategoryCard,
  CategoryMedia,
  CategoryTitle,
  PageRoot,
  QuoteMeta,
  QuoteText,
  SectionBlock,
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
  SectionTitleGroup,
  ShortcutCard,
  ShortcutFooter,
  ShortcutIconWrap,
  ShortcutText,
  ShortcutTextGroup,
  ShortcutTitle,
  ShowcaseBadge,
  ShowcaseCard,
  ShowcaseCardMeta,
  ShowcaseCardTitle,
  ShowcaseCover,
  ShowcaseHeading,
  ShowcasePanel,
  ShowcaseTitle,
  SlideAside,
  SlideCopy,
  SlideDescription,
  SlideInner,
  SlideMeta,
  SlideQuote,
  SlideTag,
  SlideTextGroup,
  SlideTitle,
} from './styled';
import type { EditorialSlide, GenreItem, GenreMasonryItem, ShortcutItem, ShowcaseItem } from './types';

const genreItems: GenreItem[] = [
  {
    title: 'Фантастика',
    image: 'https://images.pexels.com/photos/4238525/pexels-photo-4238525.jpeg',
    height: 220,
  },
  {
    title: 'Детектив',
    image: 'https://images.pexels.com/photos/2706379/pexels-photo-2706379.jpeg',
    height: 220,
  },
  {
    title: 'Трагедия',
    image: 'https://images.pexels.com/photos/2834918/pexels-photo-2834918.jpeg',
    height: 220,
  },
  {
    title: 'Повседневность',
    image: 'https://images.pexels.com/photos/2382684/pexels-photo-2382684.jpeg',
    height: 250,
  },
  {
    title: 'Романтика',
    image: 'https://images.pexels.com/photos/1037992/pexels-photo-1037992.jpeg',
    height: 220,
  },
  {
    title: 'Драма',
    image: 'https://images.pexels.com/photos/2837009/pexels-photo-2837009.jpeg',
    height: 220,
  },
  {
    title: 'Спорт',
    image: 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg',
    height: 260,
  },
  {
    title: 'Ужасы',
    image: 'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg',
    height: 250,
  },
];

const genreMasonryItems: GenreMasonryItem[] = genreItems.map((item) => ({
  key: item.title,
  height: item.height,
  data: item,
}));

const editorialSlides: EditorialSlide[] = [
  {
    title: 'Платформа для историй, в которые хочется провалиться с головой',
    description:
      'Открывайте громкие новинки, собирайте личную библиотеку и возвращайтесь к любимым главам с того же места, где остановились.',
    tags: ['Новинки', 'Тренды', 'Коллекции'],
    image: 'https://images.pexels.com/photos/4238525/pexels-photo-4238525.jpeg',
    quote: 'Хорошая главная должна не просто вести в каталог, а создавать желание остаться внутри мира.',
    quoteMeta: 'Редакционная витрина платформы',
  },
  {
    title: 'Комиксы, манга и большие миры, собранные в одном ритме',
    description:
      'Главная страница помогает быстро перейти от вдохновения к действию: открыть каталог, вернуться в профиль или найти следующий любимый жанр.',
    tags: ['Каталог', 'Профиль', 'Жанры'],
    image: 'https://images.pexels.com/photos/2706379/pexels-photo-2706379.jpeg',
    quote: 'Сильный входной экран сразу объясняет, чем сервис отличается и зачем в него хочется зайти снова.',
    quoteMeta: 'Входная точка продукта',
  },
  {
    title: 'Визуальный экран, который ощущается как обложка сервиса',
    description:
      'Большая карусель, жанровая витрина и карточки с тайтлами делают главную эмоциональной, а не просто информационной.',
    tags: ['Обложки', 'Подборки', 'Главная'],
    image: 'https://images.pexels.com/photos/2837009/pexels-photo-2837009.jpeg',
    quote: 'Главная должна работать как приглашение в мир комиксов, а не как сухой навигационный список.',
    quoteMeta: 'Тональность интерфейса',
  },
];

const popularItems: ShowcaseItem[] = [
  {
    title: 'Пылающий рассвет',
    subtitle: 'Том 1',
    meta: 'Фэнтези • 4.9',
    image: 'https://images.pexels.com/photos/4238525/pexels-photo-4238525.jpeg',
  },
  {
    title: 'Город неоновых теней',
    subtitle: 'Том 3',
    meta: 'Киберпанк • 4.7',
    image: 'https://images.pexels.com/photos/2706379/pexels-photo-2706379.jpeg',
  },
  {
    title: 'Академия героев завтрашнего дня',
    subtitle: 'Том 7',
    meta: 'Экшен • 4.8',
    image: 'https://images.pexels.com/photos/2834918/pexels-photo-2834918.jpeg',
  },
  {
    title: 'Вкус памяти',
    subtitle: 'Том 2',
    meta: 'Драма • 4.6',
    image: 'https://images.pexels.com/photos/2382684/pexels-photo-2382684.jpeg',
  },
];

const newItems: ShowcaseItem[] = [
  {
    title: 'Хроники параллельных миров',
    subtitle: 'One-shot',
    meta: 'Sci-fi • новое',
    image: 'https://images.pexels.com/photos/2837009/pexels-photo-2837009.jpeg',
  },
  {
    title: 'Полночный архив',
    subtitle: 'Том 1',
    meta: 'Детектив • релиз недели',
    image: 'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg',
  },
  {
    title: 'Сердце кометы',
    subtitle: 'Том 1',
    meta: 'Романтика • новое',
    image: 'https://images.pexels.com/photos/1037992/pexels-photo-1037992.jpeg',
  },
  {
    title: 'Последний матч сезона',
    subtitle: 'Глава 4',
    meta: 'Спорт • только вышло',
    image: 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg',
  },
];

const shortcuts: ShortcutItem[] = [
  {
    title: 'Каталог',
    description: 'Перейти к тайтлам, фильтрам и полной подборке релизов прямо сейчас.',
    href: '/catalog',
    cta: 'Открыть каталог',
    icon: <CompassOutlined />,
    accent: colors.brand.primary,
    iconBackground: colors.surface.brandSubtle,
    iconColor: colors.brand.primary,
  },
  {
    title: 'Для авторов',
    description: 'Начать путь публикации, подготовить профиль и собрать базовую витрину своих историй.',
    href: '/signup',
    cta: 'Стать автором',
    icon: <EditOutlined />,
    accent: colors.brand.secondary,
    iconBackground: colors.surface.infoSubtle,
    iconColor: colors.brand.secondary,
  },
  {
    title: 'Войти в профиль',
    description: 'Вернуться к библиотеке, истории чтения и личным настройкам интерфейса.',
    href: '/signin',
    cta: 'Открыть профиль',
    icon: <LoginOutlined />,
    accent: colors.brand.accent,
    iconBackground: colors.surface.accentSubtle,
    iconColor: colors.brand.accent,
  },
  {
    title: 'Блог редакции',
    description: 'Раздел с обзорами, подборками и заметками о новых релизах можно развивать следующим этапом.',
    href: '',
    cta: 'Скоро',
    icon: <ReadOutlined />,
    accent: colors.border.default,
    iconBackground: colors.surface.muted,
    iconColor: colors.text.muted,
    disabled: true,
  },
];

export const Home: FC = () => {
  return (
    <PageRoot vertical>
      <SectionBlock vertical>
        <CarouselFrame>
          <Carousel autoplay dots draggable>
            {editorialSlides.map((slide) => (
              <div key={slide.title}>
                <SlideInner $image={slide.image}>
                  <SlideCopy vertical>
                    <SlideTextGroup vertical>
                      <SlideMeta>
                        {slide.tags.map((tag) => (
                          <SlideTag key={tag}>{tag}</SlideTag>
                        ))}
                      </SlideMeta>
                      <SlideTitle level={2}>{slide.title}</SlideTitle>
                      <SlideDescription>{slide.description}</SlideDescription>
                    </SlideTextGroup>

                    <Link to="/catalog">
                      <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                        Перейти к тайтлам
                      </Button>
                    </Link>
                  </SlideCopy>

                  <SlideAside>
                    <SlideQuote>
                      <QuoteText>{slide.quote}</QuoteText>
                      <QuoteMeta>{slide.quoteMeta}</QuoteMeta>
                    </SlideQuote>
                  </SlideAside>
                </SlideInner>
              </div>
            ))}
          </Carousel>
        </CarouselFrame>
      </SectionBlock>

      <SectionBlock vertical>
        <SectionHeader>
          <SectionTitleGroup vertical>
            <SectionEyebrow>Fresh picks</SectionEyebrow>
            <SectionTitle level={2}>Популярное и новинки в двух быстрых витринах</SectionTitle>
          </SectionTitleGroup>
          <SectionDescription>
            Два похожих блока помогают сразу показать, что сейчас читают чаще всего и какие релизы только появились.
          </SectionDescription>
        </SectionHeader>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ShowcasePanel>
              <ShowcaseHeading>
                <ShowcaseTitle level={3}>Популярное</ShowcaseTitle>
                <ShowcaseBadge $background={colors.surface.brandSubtle} $color={colors.brand.primary}>
                  Popular
                </ShowcaseBadge>
              </ShowcaseHeading>
              <Row gutter={[16, 16]}>
                {popularItems.map((item) => (
                  <Col key={item.title} xs={24} sm={12}>
                    <CardLink to="/catalog">
                      <ShowcaseCard cover={<ShowcaseCover className="home-showcase-cover" $image={item.image} />}>
                        <ShowcaseCardTitle level={4}>{item.title}</ShowcaseCardTitle>
                        <ShowcaseCardMeta>{item.subtitle}</ShowcaseCardMeta>
                        <ShowcaseCardMeta>{item.meta}</ShowcaseCardMeta>
                      </ShowcaseCard>
                    </CardLink>
                  </Col>
                ))}
              </Row>
            </ShowcasePanel>
          </Col>

          <Col xs={24} lg={12}>
            <ShowcasePanel>
              <ShowcaseHeading>
                <ShowcaseTitle level={3}>Новинки</ShowcaseTitle>
                <ShowcaseBadge $background={colors.surface.infoSubtle} $color={colors.brand.secondary}>
                  New
                </ShowcaseBadge>
              </ShowcaseHeading>
              <Row gutter={[16, 16]}>
                {newItems.map((item) => (
                  <Col key={item.title} xs={24} sm={12}>
                    <CardLink to="/catalog">
                      <ShowcaseCard cover={<ShowcaseCover className="home-showcase-cover" $image={item.image} />}>
                        <ShowcaseCardTitle level={4}>{item.title}</ShowcaseCardTitle>
                        <ShowcaseCardMeta>{item.subtitle}</ShowcaseCardMeta>
                        <ShowcaseCardMeta>{item.meta}</ShowcaseCardMeta>
                      </ShowcaseCard>
                    </CardLink>
                  </Col>
                ))}
              </Row>
            </ShowcasePanel>
          </Col>
        </Row>
      </SectionBlock>

      <SectionBlock vertical>
        <SectionHeader>
          <SectionTitleGroup vertical>
            <SectionEyebrow>Genres</SectionEyebrow>
            <SectionTitle level={2}>Жанры как отдельная визуальная витрина</SectionTitle>
          </SectionTitleGroup>
          <SectionDescription>
            Этот блок ближе к референсу: крупные карточки категорий, на которые хочется нажать даже без дополнительного
            текста.
          </SectionDescription>
        </SectionHeader>

        <Masonry
          columns={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
          gutter={[20, 20]}
          items={genreMasonryItems}
          itemRender={({ data }) => (
            <CardLink to="/catalog">
              <CategoryCard $height={data.height}>
                <CategoryMedia className="home-category-media" $image={data.image} />
                <CategoryTitle level={3}>{data.title}</CategoryTitle>
              </CategoryCard>
            </CardLink>
          )}
        />
      </SectionBlock>

      <SectionBlock vertical>
        <SectionHeader>
          <SectionTitleGroup vertical>
            <SectionEyebrow>Fast actions</SectionEyebrow>
            <SectionTitle level={2}>Быстрые переходы для ключевых сценариев</SectionTitle>
          </SectionTitleGroup>
          <SectionDescription>
            Главная должна не только вдохновлять, но и быстро вести пользователя в нужный раздел без лишнего поиска по
            меню.
          </SectionDescription>
        </SectionHeader>

        <Row gutter={[16, 16]}>
          {shortcuts.map((shortcut) => (
            <Col key={shortcut.title} xs={24} sm={12} xl={6}>
              <ShortcutCard $accent={shortcut.accent}>
                <ShortcutIconWrap $background={shortcut.iconBackground} $color={shortcut.iconColor}>
                  {shortcut.icon}
                </ShortcutIconWrap>
                <ShortcutTextGroup vertical>
                  <ShortcutTitle level={3}>{shortcut.title}</ShortcutTitle>
                  <ShortcutText>{shortcut.description}</ShortcutText>
                </ShortcutTextGroup>
                <ShortcutFooter>
                  {shortcut.disabled ? (
                    <Button block disabled>
                      {shortcut.cta}
                    </Button>
                  ) : (
                    <Link to={shortcut.href}>
                      <Button block type="default" icon={<ArrowRightOutlined />}>
                        {shortcut.cta}
                      </Button>
                    </Link>
                  )}
                </ShortcutFooter>
              </ShortcutCard>
            </Col>
          ))}
        </Row>
      </SectionBlock>
    </PageRoot>
  );
};
