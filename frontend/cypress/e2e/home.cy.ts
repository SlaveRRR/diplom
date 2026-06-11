import { fixtureData } from '../support/fixtureData';
import { mockHomeApi } from '../support/mockApi';

describe('Home page', () => {
  it('отображает ключевые секции приложения', () => {
    mockHomeApi();

    cy.visitApp('/');
    cy.wait('@getHomeSelections');

    fixtureData('homeSelections.json').then((homeSelections) => {
      cy.contains('Популярные комиксы').should('be.visible');
      cy.contains(homeSelections.popularComics[0].title).should('be.visible');
      cy.contains('Популярные статьи').should('be.visible');
      cy.contains(homeSelections.popularPosts[0].title).should('be.visible');
      cy.contains(String(homeSelections.taxonomyTiles[0].item.name)).should('be.visible');
    });
  });
});
