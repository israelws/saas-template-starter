import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Policy, PolicyEvaluationContext, PolicyEvaluationResult } from '@saas-template/shared';

export interface PolicyState {
  policies: Policy[];
  selectedPolicy: Policy | null;
  isLoading: boolean;
  error: string | null;
  testContext: PolicyEvaluationContext | null;
  testResult: PolicyEvaluationResult | null;
}

const initialState: PolicyState = {
  policies: [],
  selectedPolicy: null,
  isLoading: false,
  error: null,
  testContext: null,
  testResult: null,
};

const policySlice = createSlice({
  name: 'policy',
  initialState,
  reducers: {
    setPolicies: (state, action: PayloadAction<Policy[]>) => {
      state.policies = action.payload;
      state.error = null;
    },
    setSelectedPolicy: (state, action: PayloadAction<Policy | null>) => {
      state.selectedPolicy = action.payload;
    },
    addPolicy: (state, action: PayloadAction<Policy>) => {
      state.policies.push(action.payload);
    },
    updatePolicy: (state, action: PayloadAction<Policy>) => {
      const index = state.policies.findIndex((policy) => policy.id === action.payload.id);
      if (index !== -1) {
        state.policies[index] = action.payload;
      }
      if (state.selectedPolicy?.id === action.payload.id) {
        state.selectedPolicy = action.payload;
      }
    },
    deletePolicy: (state, action: PayloadAction<string>) => {
      state.policies = state.policies.filter((policy) => policy.id !== action.payload);
      if (state.selectedPolicy?.id === action.payload) {
        state.selectedPolicy = null;
      }
    },
    setTestContext: (state, action: PayloadAction<PolicyEvaluationContext | null>) => {
      state.testContext = action.payload;
    },
    setTestResult: (state, action: PayloadAction<PolicyEvaluationResult | null>) => {
      state.testResult = action.payload;
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
  setPolicies,
  setSelectedPolicy,
  addPolicy,
  updatePolicy,
  deletePolicy,
  setTestContext,
  setTestResult,
  setLoading,
  setError,
} = policySlice.actions;

export default policySlice.reducer;
