// Cypress E2E test for login

describe('Justice Dashboard Login', () => {
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
