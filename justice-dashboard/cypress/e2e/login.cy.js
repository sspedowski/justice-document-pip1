// Cypress E2E test for Justice Dashboard

describe('Justice Dashboard', () => {
  it('loads the homepage and sees the title', () => {
    cy.visit('/'); // Uses baseUrl from cypress.config.js (http://localhost:5174)
    cy.contains('Justice Dashboard'); // Matches your site's headline
    cy.get('title').should('contain', 'Justice Dashboard'); // Also check page title
  });

  it('shows login form when not authenticated', () => {
    cy.visit('/');
    cy.get('input[name="username"]').should('exist');
    cy.get('input[name="password"]').should('exist');
  });

  it('shows login form and rejects invalid login', () => {
    cy.visit('/');
    cy.get('input[name="username"]').type('wrong');
    cy.get('input[name="password"]').type('wrong');
    cy.contains('button', /login/i).click();
    cy.contains(/login failed/i).should('exist');
  });

  it('accepts valid admin login', () => {
    cy.visit('/');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('adminpass');
    cy.contains('button', /login/i).click();
    cy.contains(/dashboard|welcome|logout/i).should('exist');
  });
});
