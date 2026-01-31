import React from 'react';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { fireEvent } from '@testing-library/react';
import { LeaveAnalytics } from '../LeaveAnalytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user1' },
    profile: { role: 'employee', department: 'dept1' },
  }),
}));

// Recharts needs real layout measurements; in jsdom it frequently warns/fails.
vi.mock('recharts', () => {
  const passthrough = (name: string) => ({ children }: any) => React.createElement('div', { 'data-recharts': name }, children);

  return {
    ResponsiveContainer: passthrough('ResponsiveContainer'),
    LineChart: passthrough('LineChart'),
    BarChart: passthrough('BarChart'),
    PieChart: passthrough('PieChart'),
    AreaChart: passthrough('AreaChart'),
    ScatterChart: passthrough('ScatterChart'),
    ComposedChart: passthrough('ComposedChart'),
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Line: () => null,
    Bar: () => null,
    Pie: () => null,
    Cell: () => null,
    Area: () => null,
    Scatter: () => null,
  };
});

describe('LeaveAnalytics', () => {
  const queryClient = new QueryClient();
  
  const renderComponent = () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeaveAnalytics />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('renders the analytics page shell', async () => {
    renderComponent();

    expect(screen.getByText(/leave analytics & intelligence/i)).toBeInTheDocument();

    // Wait for initial effect-driven state updates to settle
    await waitFor(() => {
      expect(screen.getAllByText(/time range/i).length).toBeGreaterThan(0);
    });
  });

  it('allows changing the date range', async () => {
    renderComponent();

    // Open the "Time Range" select
    const timeRangeCombo = screen.getByRole('combobox');
    fireEvent.mouseDown(timeRangeCombo);
    // Select a different option
    fireEvent.click(screen.getByRole('option', { name: /6 months/i }));

    await waitFor(() => {
      expect(screen.getByText(/6 months/i)).toBeInTheDocument();
    });
  });
});
