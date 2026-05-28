import { mockAuthenticatedShell, mockBlogCreateApi } from '../support/mockApi';

const selectOption = (index: number, optionText: string) => {
  cy.get('.ant-select').eq(index).click();
  cy.get('.ant-select-dropdown:visible .ant-select-item-option').contains(optionText).click();
};

describe('Blog create page', () => {
  it('создает черновик поста', () => {
    mockAuthenticatedShell();
    mockBlogCreateApi();

    cy.visitApp('/blog/create', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getBlogTags', '@getTaxonomy']);

    cy.get('input[placeholder]').first().type('Новый пост о процессе');
    cy.get('[contenteditable="true"]').should('exist');
    selectOption(1, '16+');

    cy.contains('Сохранить как черновик').click();

    cy.wait('@getBlogUploadConfig').its('request.body').should('deep.equal', {
      inlineImages: [],
    });

    cy.wait('@confirmBlogPost')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({
          title: 'Новый пост о процессе',
          ageRating: '16+',
          postDraftId: 101,
          status: 'draft',
        });
        expect(body.tagIds).to.deep.equal([]);
        expect(body.content.type).to.equal('doc');
      });

    cy.location('pathname').should('eq', '/account');
  });

  it('не отправляет пустую форму создания поста', () => {
    mockAuthenticatedShell();
    mockBlogCreateApi();

    cy.visitApp('/blog/create', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getBlogTags', '@getTaxonomy']);

    cy.contains('Сохранить как черновик').click();

    cy.contains('Введите заголовок статьи.').should('be.visible');
    cy.get('@getBlogUploadConfig.all').should('have.length', 0);
    cy.get('@confirmBlogPost.all').should('have.length', 0);
    cy.location('pathname').should('eq', '/blog/create');
  });
});
