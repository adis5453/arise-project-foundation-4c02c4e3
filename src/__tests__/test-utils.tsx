import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const theme = createTheme({
  // Match your app's theme configuration
  palette: {
    primary: {
      main: '#4f46e5',
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  route?: string;
  path?: string;
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  { route = '/', path = '/', ...options }: CustomRenderOptions = {}
) => {
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders>
      <Routes>
        <Route path={path} element={children} />
      </Routes>
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything
export * from '@testing-library/react';
// Override render method
export { customRender as render };
