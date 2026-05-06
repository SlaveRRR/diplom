import { blogPosts, mockPublicApi } from '../support/mockApi';

describe('Blog page', () => {
  it('renders blog feed from mocked responses', () => {
    mockPublicApi();

    cy.visitApp('/blog');
    cy.wait(['@getBlogPosts', '@getBlogTags']);

    cy.contains('Блог платформы').should('be.visible');
    cy.contains(blogPosts[0].title).should('be.visible');
    cy.contains(blogPosts[1].title).should('be.visible');
  });
});
