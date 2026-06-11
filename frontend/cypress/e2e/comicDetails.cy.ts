import { fixtureData } from '../support/fixtureData';
import { mockComicDetailsApi } from '../support/mockApi';

describe('Comic details page', () => {
  it('отображает детальную информацию комикса', () => {
    mockComicDetailsApi();

    cy.visitApp('/comics/1');
    cy.wait('@getComicDetails');

    fixtureData('comicDetails.json').then((comicDetails) => {
      cy.contains(comicDetails.title).should('be.visible');
      cy.contains('Эпизоды').should('be.visible');
      cy.contains(comicDetails.chapters[0].title).should('be.visible');
      cy.contains('Реакции читателей').should('be.visible');
      cy.contains('Обсуждение').should('be.visible');
      cy.contains(comicDetails.comments[0].text).should('be.visible');
    });
  });
});
