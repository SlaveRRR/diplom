import { fixtureData } from '../support/fixtureData';
import { mockPublicApi } from '../support/mockApi';

describe('Home page', () => {
  it('отображает ключевые секции приложения', () => {
    mockPublicApi();

    cy.visitApp('/');
    cy.wait(['@getCatalogComics', '@getBlogPosts', '@getTaxonomy']);

    fixtureData('catalogComics.json').then((catalogComics) => {
      fixtureData('blogPosts.json').then((blogPosts) => {
        fixtureData('taxonomy.json').then((taxonomy) => {
          cy.contains('Популярные комиксы').should('be.visible');
          cy.contains(catalogComics[0].title).should('be.visible');
          cy.contains('Популярные статьи').should('be.visible');
          cy.contains(blogPosts[0].title).should('be.visible');
          cy.contains(String(taxonomy.genres[0].label)).should('be.visible');
        });
      });
    });
  });
});
