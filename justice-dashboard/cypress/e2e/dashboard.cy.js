// Cypress E2E test for dashboard and upload

describe('Justice Dashboard Main Features', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('adminpass');
    cy.contains('button', /login/i).click();
    cy.contains(/dashboard|welcome|logout/i, { timeout: 10000 }).should('exist');
  });

  it('shows dashboard after login', () => {
    cy.contains(/dashboard|welcome/i).should('exist');
    cy.contains(/logout/i).should('exist');
  });

  it('uploads a PDF file', () => {
    // Assumes there is an input[type=file] for uploads
    const fileName = 'sample.pdf';
    cy.fixture(fileName, 'base64').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent: Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf'),
        fileName,
        mimeType: 'application/pdf',
      });
    });
    cy.contains(/upload|success|complete/i, { timeout: 10000 }).should('exist');
  });
});
