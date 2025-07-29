import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import organizationReducer from './slices/organizationSlice';
import userReducer from './slices/userSlice';
import policyReducer from './slices/policySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    organization: organizationReducer,
    user: userReducer,
    policy: policyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
