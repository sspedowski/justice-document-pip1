import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import StaffToolbar from '@/StaffToolbar.jsx';

describe('StaffToolbar component', () => {
  it('renders null in test mode and does nothing by default', () => {
    const { container } = render(<StaffToolbar />);
    // It doesn't render anything visible; ensure no vercel toolbar script tag exists
    expect(container.firstChild).toBeNull();
    expect(document.querySelector('script[data-vercel-toolbar]')).toBeNull();
  });
});
