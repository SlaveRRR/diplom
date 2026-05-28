import { mockPublicApi } from '../support/mockApi';

describe('Catalog page', () => {
  it('отображает страницу и применяет фильтры', () => {
    mockPublicApi();

    cy.visitApp('/catalog?genre=1');
    cy.wait(['@getCatalogComics', '@getTaxonomy']);

    cy.contains('Добро пожаловать в каталог').should('be.visible');
    cy.passOnboarding(5);

    cy.contains('h3', 'Каталог').should('be.visible');
    cy.contains('Найдено: 1 из 2').should('be.visible');

    cy.contains('h3', 'Каталог')
      .closest('section')
      .within(() => {
        cy.contains('Лунная башня').should('be.visible');
        cy.contains('Техно-ветер').should('not.exist');
      });
  });

  it('показывает нулевой результат при фильтре без совпадений', () => {
    mockPublicApi();

    cy.visitApp('/catalog');
    cy.wait(['@getCatalogComics', '@getTaxonomy']);
    cy.passOnboarding(5);

    cy.get('input[placeholder="Поиск по названию, автору или описанию"]').type('несуществующий комикс');

    cy.contains('Найдено: 0 из 2').should('be.visible');
    cy.contains('h3', 'Каталог')
      .closest('section')
      .within(() => {
        cy.contains('Лунная башня').should('not.exist');
        cy.contains('Техно-ветер').should('not.exist');
      });
  });
});
