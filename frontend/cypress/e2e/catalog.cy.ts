describe('Catalog page', () => {
  const moonTower = {
    id: 1,
    title: 'Лунная башня',
    description: 'История о молодой команде, которая исследует древний маяк между мирами.',
    cover: 'https://placehold.co/480x640',
    coverUrl: 'https://placehold.co/480x640',
    ageRating: '16+',
    author: 'Aster',
    genreId: 1,
    genre: 'Фэнтези',
    tagIds: [11, 12],
    tags: ['Магия', 'Приключение'],
    rating: 4.8,
    reviews: 124,
    likesCount: 820,
    readersCount: 5100,
    status: 'published',
    isNew: true,
    isTrending: true,
  };

  const technoWind = {
    id: 2,
    title: 'Техно-ветер',
    description: 'Неоновый мегаполис и история курьера, попавшего в корпоративный заговор.',
    cover: 'https://placehold.co/480x640?text=Tech',
    coverUrl: 'https://placehold.co/480x640?text=Tech',
    ageRating: '18+',
    author: 'Nova',
    genreId: 2,
    genre: 'Киберпанк',
    tagIds: [13],
    tags: ['Будущее'],
    rating: 4.3,
    reviews: 87,
    likesCount: 410,
    readersCount: 2990,
    status: 'published',
    isNew: false,
    isTrending: true,
  };

  const buildCatalogResponse = (items: (typeof moonTower)[], total = items.length) => ({
    data: {
      items,
      pagination: {
        page: 1,
        pageSize: 12,
        total,
        totalPages: Math.max(1, Math.ceil(total / 12)),
      },
    },
    error: null,
  });

  const mockCatalogPageApi = () => {
    cy.intercept('GET', '**/api/v1/taxonomy*', { fixture: 'taxonomy.json' }).as('getTaxonomy');

    cy.intercept({ method: 'GET', pathname: '/api/v1/comics/' }, (req) => {
      const search = String(req.query.search ?? '')
        .trim()
        .toLowerCase();
      const genreId = String(req.query.genre_id ?? '');

      if (search === 'несуществующий комикс') {
        req.reply(buildCatalogResponse([], 0));
        return;
      }

      if (genreId === '1') {
        req.reply(buildCatalogResponse([moonTower], 1));
        return;
      }

      req.reply(buildCatalogResponse([moonTower, technoWind], 2));
    }).as('getCatalogComics');
  };

  it('отображает страницу и применяет фильтры', () => {
    mockCatalogPageApi();

    cy.visitApp('/catalog?genre=1');
    cy.wait(['@getCatalogComics', '@getTaxonomy']);
    cy.wait('@getCatalogComics');
    cy.passOnboarding(5);

    cy.contains('h2', 'Откройте для себя мир комиксов').should('be.visible');
    cy.contains('h3', 'Каталог').should('be.visible');
    cy.contains('Найдено: 1').should('be.visible');

    cy.contains('h3', 'Каталог')
      .closest('section')
      .within(() => {
        cy.contains('Лунная башня').should('be.visible');
        cy.contains('Техно-ветер').should('not.exist');
      });
  });

  it('показывает нулевой результат при фильтре без совпадений', () => {
    mockCatalogPageApi();

    cy.visitApp('/catalog');
    cy.wait(['@getCatalogComics', '@getTaxonomy']);
    cy.passOnboarding(5);

    cy.get('input[placeholder="Поиск по названию, автору или описанию"]').type('несуществующий комикс');
    cy.wait('@getCatalogComics');

    cy.contains('Найдено: 0').should('be.visible');
    cy.contains('Каталог пока пуст. Когда появятся опубликованные комиксы, они отобразятся здесь.').should(
      'be.visible',
    );
    cy.contains('button', 'Сбросить фильтры').should('be.visible');
  });
});
