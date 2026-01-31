// Setup file for Jest tests
import '@testing-library/jest-dom';
import {cleanup} from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// MUI + virtualization libs often require ResizeObserver in tests
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = ResizeObserverMock;

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
