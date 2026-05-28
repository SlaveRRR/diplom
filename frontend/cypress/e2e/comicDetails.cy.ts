import { fixtureData } from '../support/fixtureData';
import { mockComicDetailsApi, mockPublicApi } from '../support/mockApi';

describe('Comic details page', () => {
  it('отображает детальную информацию комикса', () => {
    mockPublicApi();
    mockComicDetailsApi();

    cy.visitApp('/comics/1');
    cy.wait('@getComicDetails');

    fixtureData('comicDetails.json').then((comicDetails) => {
      cy.contains(comicDetails.title).should('be.visible');
      cy.contains('Эпизоды').should('be.visible');
      cy.contains(comicDetails.chapters[0].title).should('be.visible');
      cy.contains('Обсуждение').should('be.visible');
      cy.contains(comicDetails.comments[0].text).should('be.visible');
    });
  });
});
