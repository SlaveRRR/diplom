import { mockAuthenticatedShell, mockComicCreateApi } from '../support/mockApi';

const imageFixture = {
  contents: Cypress.Buffer.from('fake-image-content'),
  fileName: 'image.png',
  mimeType: 'image/png',
};

const selectOptionByText = (index: number, optionText: string) => {
  cy.get('.ant-select').eq(index).click();
  cy.get('.ant-select-dropdown:visible .ant-select-item-option').contains(optionText).click();
};

const selectFirstVisibleOption = (index: number) => {
  cy.get('.ant-select').eq(index).click();
  cy.get('.ant-select-dropdown:visible .ant-select-item-option').first().click();
};

describe('Comic create page', () => {
  it('создает пошагово черновик комикса', () => {
    mockAuthenticatedShell();
    mockComicCreateApi();

    cy.visitApp('/comics/create', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getTaxonomy']);

    cy.get('input').first().type('Эхо башни');
    cy.get('textarea').first().type('История о городе, который слышит свои башни.');
    selectOptionByText(0, '16+');
    selectFirstVisibleOption(1);
    cy.get('body').click(0, 0);
    selectFirstVisibleOption(2);

    cy.contains('Далее').click();

    cy.get('input[type="file"]')
      .eq(0)
      .selectFile({ ...imageFixture, fileName: 'cover.png' }, { force: true });
    cy.get('input[type="file"]')
      .eq(1)
      .selectFile({ ...imageFixture, fileName: 'banner.png' }, { force: true });

    cy.contains('Далее').click();

    cy.get('input').first().type('Глава 1: Начало');
    cy.get('textarea').first().type('Первый шаг в историю города.');
    cy.get('input[type="file"]')
      .eq(0)
      .selectFile({ ...imageFixture, fileName: 'page-1.png' }, { force: true });

    cy.contains('Далее').click();
    cy.contains('Эхо башни').should('be.visible');
    cy.contains('Создать комикс').click();

    cy.wait('@getComicUploadConfig')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({
          title: 'Эхо башни',
          ageRating: '16+',
          genreId: 1,
        });
        expect(body.tagIds).to.deep.equal([11]);
        expect(body.cover.filename).to.equal('cover.png');
        expect(body.banner.filename).to.equal('banner.png');
        expect(body.chapters).to.have.length(1);
        expect(body.chapters[0]).to.include({
          title: 'Глава 1: Начало',
          chapter_number: 1,
        });
        expect(body.chapters[0].pages[0].filename).to.equal('page-1.png');
      });

    cy.wait(['@uploadComicCover', '@uploadComicBanner', '@uploadComicPage1']);
    cy.wait('@confirmComicCreation').its('request.body').should('deep.equal', {
      comic_draft_id: 'draft-501',
    });

    cy.location('pathname').should('eq', '/catalog');
  });

  it('не переводит на следующий шаг без названия комикса', () => {
    mockAuthenticatedShell();
    mockComicCreateApi();

    cy.visitApp('/comics/create', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getTaxonomy']);

    cy.contains('Далее').click();

    cy.contains('Добавьте название комикса.').should('be.visible');
    cy.contains('Базовая информация').should('be.visible');
    cy.contains('Основная карточка комикса для каталога и списка релизов.').should('not.exist');
    cy.get('@getComicUploadConfig.all').should('have.length', 0);
    cy.get('@confirmComicCreation.all').should('have.length', 0);
  });
});
