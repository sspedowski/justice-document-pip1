import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App.jsx';
import { cleanup } from '@testing-library/react';
import App from '../src/App'; // Assuming App.jsx

// Basic smoke test that the app renders the visible title
describe('App Component Smoke Test', () => {
  afterEach(cleanup);

describe('App smoke', () => {
  it('renders Justice Dashboard title', () => {
  it('should render the main application component without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Justice Dashboard/i)).toBeInTheDocument();
    const headingElement = screen.getByRole('heading', {
      name: /justice dashboard/i,
    });
    expect(headingElement).toBeInTheDocument();
  });
});
