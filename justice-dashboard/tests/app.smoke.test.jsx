import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App.jsx';

// Basic smoke test that the app renders the visible title

describe('App smoke', () => {
  it('renders Justice Dashboard title', () => {
    render(<App />);
    expect(screen.getByText(/Justice Dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Justice Dashboard/i })).toBeInTheDocument();
  });
});
