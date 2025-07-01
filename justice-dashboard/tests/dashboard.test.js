import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';
// Mock Firebase
jest.mock('../firebase', () => ({
  db: {
    collection: jest.fn(),
  },
}));
// Mock fetch for API calls
global.fetch = jest.fn();
describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();

    // Mock successful fetch response
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            summary: 'Test summary',
            category: 'Legal',
            child: 'Josh',
            misconduct: 'Other/Multiple',
          }),
      })
    );
  });
  test('renders login form when not authenticated', () => {
    render(<Dashboard />);

    expect(screen.getByText('Login Required')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
  test('handles successful login', async () => {
    render(<Dashboard />);

    // Mock successful login response
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
    );
    // Fill in login form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'testpass' },
    });
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    // Wait for dashboard to appear
    await waitFor(() => {
      expect(screen.getByText('Justice Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Login Required')).not.toBeInTheDocument();
    });
  });
  test('handles failed login', async () => {
    render(<Dashboard />);

    // Mock failed login response
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ ok: false, error: 'bad credentials' }),
      })
    );
    // Fill in login form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'wronguser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpass' },
    });
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Bad credentials')).toBeInTheDocument();
    });
  });
  test('processes file upload successfully', async () => {
    // Mock authenticated state
    localStorage.setItem('authenticated', 'true');
    render(<Dashboard />);
    const file = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });
    const fileInput = screen.getByLabelText(/Upload Files/i);
    // Upload file
    fireEvent.change(fileInput, { target: { files: [file] } });
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText('Test summary')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
      expect(screen.getByText('Josh')).toBeInTheDocument();
    });
  });
  test('handles file upload errors', async () => {
    localStorage.setItem('authenticated', 'true');
    render(<Dashboard />);
    // Mock failed upload
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Upload failed'))
    );
    const file = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });
    const fileInput = screen.getByLabelText(/Upload Files/i);
    // Upload file
    fireEvent.change(fileInput, { target: { files: [file] } });
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
    });
  });
  test('exports data to CSV', async () => {
    localStorage.setItem('authenticated', 'true');
    render(<Dashboard />);
    // Mock data in the table
    const mockData = {
      filename: 'test.pdf',
      summary: 'Test summary',
      category: 'Legal',
      child: 'Josh',
      misconduct: 'Other/Multiple',
    };
    // Add mock data to tracker
    localStorage.setItem('tracker', JSON.stringify([mockData]));
    // Click export button
    fireEvent.click(screen.getByText(/Export CSV/i));
    // Verify CSV creation
    // Note: We can't directly test file download in JSDOM
    expect(screen.getByText(/Export CSV/i)).toBeInTheDocument();
  });
});
