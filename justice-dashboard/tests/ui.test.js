// UI smoke test using @testing-library/react and Jest
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import App from '../frontend/App';

describe('Justice Dashboard UI', () => {
  it('renders login form', () => {
    render(<App />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows error on invalid login', async () => {
    render(<App />);
    userEvent.type(screen.getByLabelText(/username/i), 'wrong');
    userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
  });
});
