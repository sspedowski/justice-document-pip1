// UI smoke test using @testing-library/react and Jest
import { render, screen } from '@testing-library/react';

import App from '../src/App';

describe('Justice Dashboard UI', () => {
  it('renders dashboard heading and upload controls', () => {
    render(<App />);
    expect(screen.getByText(/justice dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select files/i })).toBeInTheDocument();
  });
});
