import { render, screen } from '@/__tests__/test-utils';
import { fireEvent } from '@testing-library/react';
import { LeaveBalance } from '../LeaveBalance';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

describe('LeaveBalance', () => {
  const queryClient = new QueryClient();
  
  const renderComponent = () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeaveBalance />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('renders leave balance section', () => {
    renderComponent();
    
    // Check if the section title is present
    expect(screen.getByText(/my leave balance/i)).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /request leave/i })).toBeInTheDocument();
  });

  it('allows requesting new leave from the balance card', async () => {
    const mockOnRequestLeave = vi.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <LeaveBalance onRequestLeave={mockOnRequestLeave} />
      </QueryClientProvider>
    );
    
    // Click the request button on the first leave type card
    const requestButtons = screen.getAllByRole('button', { name: /request leave/i });
    fireEvent.click(requestButtons[0]);
    
    // Verify the callback was called with the correct leave type
    expect(mockOnRequestLeave).toHaveBeenCalledWith('annual');
  });
});
