import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Organization } from '@saas-template/shared';

export interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrganizationState = {
  organizations: [],
  currentOrganization: null,
  isLoading: false,
  error: null,
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setOrganizations: (state, action: PayloadAction<Organization[]>) => {
      state.organizations = action.payload;
      state.error = null;
    },
    setCurrentOrganization: (state, action: PayloadAction<Organization>) => {
      state.currentOrganization = action.payload;
    },
    addOrganization: (state, action: PayloadAction<Organization>) => {
      state.organizations.push(action.payload);
    },
    updateOrganization: (state, action: PayloadAction<Organization>) => {
      const index = state.organizations.findIndex((org) => org.id === action.payload.id);
      if (index !== -1) {
        state.organizations[index] = action.payload;
      }
      if (state.currentOrganization?.id === action.payload.id) {
        state.currentOrganization = action.payload;
      }
    },
    deleteOrganization: (state, action: PayloadAction<string>) => {
      state.organizations = state.organizations.filter((org) => org.id !== action.payload);
      if (state.currentOrganization?.id === action.payload) {
        state.currentOrganization = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setOrganizations,
  setCurrentOrganization,
  addOrganization,
  updateOrganization,
  deleteOrganization,
  setLoading,
  setError,
} = organizationSlice.actions;

export default organizationSlice.reducer;
