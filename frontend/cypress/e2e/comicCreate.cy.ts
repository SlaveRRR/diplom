import { mockAuthenticatedShell, mockComicCreateApi } from '../support/mockApi';

const imageFixture = {
  contents: Cypress.Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnS6e8AAAAASUVORK5CYII=',
    'base64',
  ),
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

const installImageWorkerMock = () => {
  cy.window().then((win) => {
    class MockImageWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;

      onerror: ((event: Event) => void) | null = null;

      postMessage(payload: { file: File }) {
        const sourceFile = payload.file;
        const baseName = sourceFile.name.replace(/\.[^.]+$/u, '');
        const normalizedFile = new win.File([sourceFile], `${baseName}.webp`, {
          type: 'image/webp',
          lastModified: sourceFile.lastModified,
        });

        setTimeout(() => {
          this.onmessage?.({
            data: {
              success: true,
              file: normalizedFile,
            },
          } as MessageEvent);
        }, 0);
      }

      terminate() {
        return undefined;
      }
    }

    win.Worker = MockImageWorker as unknown as typeof Worker;
  });
};

describe('Comic create page', () => {
  it('создает комикс и отправляет его на модерацию', () => {
    mockAuthenticatedShell();
    mockComicCreateApi();

    cy.visitApp('/comics/create', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getTaxonomy']);
    installImageWorkerMock();

    cy.get('input[placeholder="Например, Лунная башня"]').type('Эхо башни');
    cy.get('textarea[placeholder="Коротко опиши завязку, мир и настроение истории."]').type(
      'История о городе, который слышит свои башни.',
    );
    selectOptionByText(0, '16+');
    selectFirstVisibleOption(1);
    cy.get('body').click(0, 0);
    selectFirstVisibleOption(2);

    cy.contains('button', 'Далее').click();

    cy.get('input[type="file"]')
      .eq(0)
      .selectFile({ ...imageFixture, fileName: 'cover.png' }, { force: true });
    cy.get('input[type="file"]')
      .eq(1)
      .selectFile({ ...imageFixture, fileName: 'banner.png' }, { force: true });

    cy.contains('cover.webp').should('be.visible');
    cy.contains('banner.webp').should('be.visible');

    cy.contains('button', 'Далее').click();

    cy.get('input[placeholder="Например, Глава 1. Пепел у порога"]').type('Глава 1: Начало');
    cy.get('textarea[placeholder="Короткая подводка к содержанию главы."]').type('Первый шаг в историю города.');
    cy.get('input[type="file"]')
      .eq(0)
      .selectFile({ ...imageFixture, fileName: 'page-1.png' }, { force: true });

    cy.contains('page-1.webp').should('be.visible');

    cy.contains('button', 'Далее').click();
    cy.contains('Эхо башни').should('be.visible');
    cy.contains('button', 'Отправить на модерацию').click();

    cy.wait('@getComicUploadConfig')
      .its('request.body')
      .should((body) => {
        expect(body).to.include({
          title: 'Эхо башни',
          ageRating: '16+',
          genreId: 1,
        });
        expect(body.tagIds).to.deep.equal([11]);
        expect(body.cover.filename).to.equal('cover.webp');
        expect(body.banner.filename).to.equal('banner.webp');
        expect(body.chapters).to.have.length(1);
        expect(body.chapters[0]).to.include({
          title: 'Глава 1: Начало',
          chapter_number: 1,
        });
        expect(body.chapters[0].pages[0].filename).to.equal('page-1.webp');
      });

    cy.wait('@confirmComicCreation').its('request.body').should('deep.include', {
      comic_draft_id: 'draft-501',
      submission_mode: 'under_review',
    });

    cy.location('pathname').should('eq', '/account');
  });

  it('не переводит на следующий шаг без названия комикса', () => {
    mockAuthenticatedShell();
    mockComicCreateApi();

    cy.visitApp('/comics/create', { authenticated: true });
    cy.wait(['@getCurrentUser', '@getAccount', '@getNotifications', '@getTaxonomy']);
    installImageWorkerMock();

    cy.contains('button', 'Далее').click();

    cy.contains('Добавьте название комикса.').should('be.visible');
    cy.contains('Название').should('be.visible');
    cy.contains('Основная карточка комикса для каталога и списка релизов.').should('not.exist');
    cy.get('@getComicUploadConfig.all').should('have.length', 0);
    cy.get('@confirmComicCreation.all').should('have.length', 0);
  });
});
