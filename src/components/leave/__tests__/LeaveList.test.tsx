import { render, screen } from '@/__tests__/test-utils';
import { LeaveList } from '../LeaveList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

describe('LeaveList', () => {
  const queryClient = new QueryClient();
  
  const renderComponent = () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeaveList />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('renders the leave requests table', async () => {
    renderComponent();
    
    // Check if the table headers are present
    expect(screen.getByText(/request number/i)).toBeInTheDocument();
    expect(screen.getByText(/employee/i)).toBeInTheDocument();
    expect(screen.getByText(/leave type/i)).toBeInTheDocument();
    expect(screen.getByText(/dates/i)).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/actions/i)).toBeInTheDocument();
    
    // LeaveList is currently a simple compatibility wrapper (headers only).
  });

  // Other behaviors (loading/error/filtering) are tested on the richer LeaveRequestList/LeaveManagement components.
});
