// Cypress E2E test for file upload and PDF processing

describe('Justice Dashboard - File Upload & Processing', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('adminpass');
    cy.contains('button', /login/i).click();
    cy.contains(/dashboard|welcome|logout/i, { timeout: 10000 }).should('exist');
  });

  it('uploads a PDF document successfully', () => {
    // Test file upload functionality
    cy.get('input[type="file"]').should('exist');
    cy.fixture('sample.pdf', 'base64').then(fileContent => {
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: 'legal-document.pdf',
        mimeType: 'application/pdf',
      });
    });
    
    // Verify upload feedback
    cy.contains(/upload|processing|success/i, { timeout: 15000 }).should('exist');
  });

  it('displays uploaded document in document list', () => {
    // After upload, check document appears in list/table
    cy.get('[data-testid="document-list"]').should('exist');
    cy.contains('legal-document.pdf').should('exist');
  });

  it('allows document preview/viewing', () => {
    // Test PDF viewer functionality
    cy.contains('legal-document.pdf').click();
    cy.get('[data-testid="pdf-viewer"]').should('be.visible');
    cy.contains(/page|pdf|document/i).should('exist');
  });

  it('enables document tagging and categorization', () => {
    // Test legal document tagging
    cy.get('[data-testid="tag-input"]').type('Evidence{enter}');
    cy.get('[data-testid="category-select"]').select('Legal Evidence');
    cy.contains('button', /save|update/i).click();
    cy.contains(/saved|updated/i).should('exist');
  });
});
