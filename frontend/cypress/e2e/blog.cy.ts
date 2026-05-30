import { fixtureData } from '../support/fixtureData';
import { mockPublicApi } from '../support/mockApi';

describe('Blog page', () => {
  it('отображает страницу блога', () => {
    mockPublicApi();

    cy.visitApp('/blog');
    cy.wait(['@getBlogPosts', '@getBlogTags']);

    fixtureData('blogPosts.json').then((blogPosts) => {
      cy.contains('Блог').should('be.visible');
      cy.contains(blogPosts[0].title).should('be.visible');
      cy.contains(blogPosts[1].title).should('be.visible');
    });
  });
});
