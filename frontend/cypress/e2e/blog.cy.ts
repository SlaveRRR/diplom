import { fixtureData } from '../support/fixtureData';
import { mockBlogPageApi } from '../support/mockApi';

describe('Blog page', () => {
  it('отображает страницу блога и пагинацию', () => {
    mockBlogPageApi();

    cy.visitApp('/blog');
    cy.wait(['@getBlogPosts', '@getBlogTags']);

    fixtureData('blogPosts.json').then((blogPosts) => {
      cy.contains('h1', 'Блог').should('be.visible');
      cy.contains(blogPosts.items[0].title).should('be.visible');
      cy.contains(blogPosts.items[1].title).should('be.visible');
      cy.get('.ant-pagination').should('be.visible');
      cy.contains('.ant-pagination-item', '2').should('be.visible');
    });
  });
});
