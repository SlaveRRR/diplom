import { blogPosts, catalogComics, mockPublicApi, taxonomy } from '../support/mockApi';

describe('Home page', () => {
  it('renders key home sections from mocked API responses', () => {
    mockPublicApi();

    cy.visitApp('/');

    cy.wait(['@getCatalogComics', '@getBlogPosts', '@getTaxonomy']);

    cy.contains('Популярные комиксы').should('be.visible');
    cy.contains(catalogComics[0].title).should('be.visible');
    cy.contains('Популярные статьи').should('be.visible');
    cy.contains(blogPosts[0].title).should('be.visible');
    cy.contains(String(taxonomy.genres[0].label)).should('be.visible');
  });
});
