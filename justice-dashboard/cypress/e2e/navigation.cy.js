// Cypress E2E test for dashboard navigation and user workflows

describe('Justice Dashboard - Navigation & Workflows', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('adminpass');
    cy.contains('button', /login/i).click();
    cy.contains(/dashboard|welcome|logout/i, { timeout: 10000 }).should('exist');
  });

  it('navigates through main dashboard sections', () => {
    // Test main navigation menu
    cy.get('[data-testid="nav-documents"]').click();
    cy.url().should('include', '/documents');
    
    cy.get('[data-testid="nav-evidence"]').click();
    cy.url().should('include', '/evidence');
    
    cy.get('[data-testid="nav-court-orders"]').click();
    cy.url().should('include', '/court-orders');
  });

  it('displays document statistics and summaries', () => {
    // Test dashboard analytics/stats
    cy.get('[data-testid="total-documents"]').should('contain.text', /\d+/);
    cy.get('[data-testid="recent-uploads"]').should('exist');
    cy.get('[data-testid="pending-review"]').should('exist');
  });

  it('searches and filters documents', () => {
    // Test search functionality
    cy.get('[data-testid="search-input"]').type('evidence');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="search-results"]').should('exist');
    
    // Test filter functionality
    cy.get('[data-testid="filter-by-date"]').select('Last 30 days');
    cy.get('[data-testid="filter-by-type"]').select('PDF');
    cy.contains('button', /apply|filter/i).click();
  });

  it('logs out successfully', () => {
    // Test logout functionality
    cy.get('[data-testid="logout-button"]').click();
    cy.contains(/login|sign in/i).should('exist');
    cy.url().should('include', '/login');
  });
});
