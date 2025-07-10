import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import organizationsReducer from '@/store/slices/organizationSlice';
import usersReducer from '@/store/slices/userSlice';
import policiesReducer from '@/store/slices/policySlice';

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any;
  store?: any;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authReducer,
        organizations: organizationsReducer,
        users: usersReducer,
        policies: policiesReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock data generators
export const mockOrganization = (overrides = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  code: 'TEST_ORG',
  description: 'Test organization description',
  type: 'company',
  status: 'active',
  parentId: null,
  settings: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  status: 'active',
  attributes: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockPolicy = (overrides = {}) => ({
  id: 'policy-123',
  name: 'Test Policy',
  description: 'Test policy description',
  resource: 'organization:*',
  action: 'read',
  effect: 'allow',
  priority: 50,
  status: 'active',
  conditions: {},
  organizationId: 'org-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockOrganizationStats = (overrides = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  type: 'company',
  status: 'active',
  directChildrenCount: 3,
  totalDescendantsCount: 10,
  directUsersCount: 5,
  totalUsersCount: 25,
  directPoliciesCount: 2,
  totalPoliciesCount: 8,
  productsCount: 15,
  customersCount: 100,
  ...overrides,
});

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
