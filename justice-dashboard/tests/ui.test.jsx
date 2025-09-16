import { render, screen } from '@testing-library/react'
import App from '../src/App.jsx'

describe('UI', () => {
  it('renders the dashboard shell', () => {
    render(<App />)
    expect(screen.getByText(/justice dashboard/i)).toBeTruthy()
  })
})
