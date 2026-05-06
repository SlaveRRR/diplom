import { mockPublicApi } from '../support/mockApi';

describe('Catalog page', () => {
  it('applies preset genre filter from query params', () => {
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
});
