import authReducer, { loginStart, loginSuccess, loginFailure, logout } from '../authSlice';
import { mockUser } from '@/test-utils';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('login actions', () => {
    it('should handle loginStart', () => {
      const actual = authReducer(initialState, loginStart());
      expect(actual.isLoading).toBe(true);
      expect(actual.error).toBe(null);
    });

    it('should handle loginSuccess', () => {
      const user = mockUser();
      const token = 'test-token';

      const actual = authReducer(
        { ...initialState, isLoading: true },
        loginSuccess({ user, token }),
      );

      expect(actual).toEqual({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    });

    it('should handle loginFailure', () => {
      const error = 'Invalid credentials';

      const actual = authReducer({ ...initialState, isLoading: true }, loginFailure(error));

      expect(actual).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error,
      });
    });
  });

  describe('logout', () => {
    it('should handle logout', () => {
      const authenticatedState = {
        user: mockUser(),
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      const actual = authReducer(authenticatedState, logout());
      expect(actual).toEqual(initialState);
    });
  });

  describe('complex scenarios', () => {
    it('should handle failed login after successful login', () => {
      const authenticatedState = {
        user: mockUser(),
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      // Start new login
      let state = authReducer(authenticatedState, loginStart());
      expect(state.isLoading).toBe(true);

      // Login fails
      state = authReducer(state, loginFailure('Network error'));

      // Should clear auth state on login failure
      expect(state).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Network error',
      });
    });
  });
});
