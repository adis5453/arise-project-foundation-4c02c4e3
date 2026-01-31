import { render, screen, fireEvent, waitFor, act } from '@/__tests__/test-utils';
import { LeaveRequestForm } from '../LeaveRequestForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Prevent real network calls during tests.
vi.mock('@/services/databaseService', () => ({
  default: {
    getLeaveBalances: vi.fn().mockResolvedValue([]),
    getUserProfiles: vi.fn().mockResolvedValue([]),
  },
}));

const mockSubmit = vi.fn().mockResolvedValue(undefined);

describe('LeaveRequestForm', () => {
  const queryClient = new QueryClient();
  
  const renderComponent = (opts?: { editingRequest?: any }) => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeaveRequestForm
          open
          onClose={vi.fn()}
          employeeId="emp1"
          editingRequest={opts?.editingRequest ?? null}
            onSubmit={mockSubmit as any}
        />
      </QueryClientProvider>
    );
  };

  const flush = async () => {
    // Allow MUI transitions/effects to settle in JSDOM
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('renders the leave request dialog shell', async () => {
    renderComponent();
    await flush();
    
    await waitFor(() => {
      expect(screen.getByText(/new leave request/i)).toBeInTheDocument();
    });

    // Basic fields (MUI Select label isn't associated via <label for>, so use role queries)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    // MUI X DatePicker renders a composite input with role="group"
    expect(screen.getByRole('group', { name: /start date/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /end date/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /reason for leave/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('keeps Next disabled until required fields are filled', async () => {
    renderComponent();
    await flush();

    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeDisabled();
  });

  it('calls onSubmit when submitting from the final step', async () => {
    // Pre-fill via editingRequest to avoid brittle DatePicker typing interactions.
    renderComponent({
      editingRequest: {
        leave_type_id: 'annual',
        start_date: '2025-03-01',
        end_date: '2025-03-05',
        reason: 'Vacation',
      },
    });

    await flush();

    // Step 0 -> 1 -> 2 -> 3
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });
    await flush();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });
    await flush();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });
});
