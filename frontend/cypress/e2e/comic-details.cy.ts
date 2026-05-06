import { comicDetails, mockComicDetailsApi, mockPublicApi } from '../support/mockApi';

describe('Comic details page', () => {
  it('renders comic details, chapters and comments', () => {
    mockPublicApi();
    mockComicDetailsApi();

    cy.visitApp('/comics/1');
    cy.wait('@getComicDetails');

    cy.contains(comicDetails.title).should('be.visible');
    cy.contains('Эпизоды').should('be.visible');
    cy.contains(comicDetails.chapters[0].title).should('be.visible');
    cy.contains('Обсуждение').should('be.visible');
    cy.contains(comicDetails.comments[0].text).should('be.visible');
  });
});
