import policiesReducer, {
  setPolicies,
  setSelectedPolicy,
  addPolicy,
  updatePolicy,
  deletePolicy,
  setTestContext,
  setTestResult,
  setLoading,
  setError,
} from '../policySlice';
import { mockPolicy } from '@/test-utils';

describe('policiesSlice', () => {
  const initialState = {
    policies: [],
    selectedPolicy: null,
    testContext: null,
    testResult: null,
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(policiesReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('policies management', () => {
    it('should handle setPolicies', () => {
      const policies = [
        mockPolicy({ id: '1', name: 'Policy 1' }),
        mockPolicy({ id: '2', name: 'Policy 2' }),
      ];

      const actual = policiesReducer(initialState, setPolicies(policies));

      expect(actual.policies).toEqual(policies);
    });

    it('should handle setSelectedPolicy', () => {
      const policy = mockPolicy({ id: '1', name: 'Test Policy' });

      const actual = policiesReducer(initialState, setSelectedPolicy(policy));

      expect(actual.selectedPolicy).toEqual(policy);
    });

    it('should handle addPolicy', () => {
      const existingPolicies = [mockPolicy({ id: '1', name: 'Policy 1', priority: 50 })];
      const newPolicy = mockPolicy({ id: '2', name: 'New Policy', priority: 60 });

      const actual = policiesReducer(
        { ...initialState, policies: existingPolicies },
        addPolicy(newPolicy),
      );

      expect(actual.policies).toEqual([...existingPolicies, newPolicy]);
    });

    it('should handle updatePolicy', () => {
      const existingPolicies = [
        mockPolicy({ id: '1', name: 'Policy 1', effect: 'allow' }),
        mockPolicy({ id: '2', name: 'Policy 2', effect: 'deny' }),
      ];
      const updatedPolicy = mockPolicy({
        id: '1',
        name: 'Updated Policy 1',
        effect: 'deny',
      });

      const actual = policiesReducer(
        { ...initialState, policies: existingPolicies },
        updatePolicy(updatedPolicy),
      );

      expect(actual.policies[0]).toEqual(updatedPolicy);
      expect(actual.policies[1]).toEqual(existingPolicies[1]);
    });

    it('should update selectedPolicy if it matches', () => {
      const selectedPolicy = mockPolicy({ id: '1', name: 'Policy 1' });
      const updatedPolicy = mockPolicy({
        id: '1',
        name: 'Updated Policy 1',
      });

      const actual = policiesReducer(
        {
          ...initialState,
          policies: [selectedPolicy],
          selectedPolicy,
        },
        updatePolicy(updatedPolicy),
      );

      expect(actual.selectedPolicy).toEqual(updatedPolicy);
    });

    it('should handle deletePolicy', () => {
      const existingPolicies = [
        mockPolicy({ id: '1', name: 'Policy 1' }),
        mockPolicy({ id: '2', name: 'Policy 2' }),
      ];

      const actual = policiesReducer(
        { ...initialState, policies: existingPolicies },
        deletePolicy('1'),
      );

      expect(actual.policies).toEqual([existingPolicies[1]]);
    });

    it('should clear selectedPolicy if it was deleted', () => {
      const selectedPolicy = mockPolicy({ id: '1', name: 'Policy 1' });

      const actual = policiesReducer(
        {
          ...initialState,
          policies: [selectedPolicy],
          selectedPolicy,
        },
        deletePolicy('1'),
      );

      expect(actual.selectedPolicy).toBe(null);
    });
  });

  describe('policy testing', () => {
    it('should handle setTestContext', () => {
      const testContext = {
        subject: { role: 'admin' },
        resource: { type: 'organization' },
        action: 'read',
        environment: {},
      };

      const actual = policiesReducer(initialState, setTestContext(testContext));

      expect(actual.testContext).toEqual(testContext);
    });

    it('should handle setTestResult', () => {
      const testResult = {
        allowed: true,
        matchedPolicies: [mockPolicy({ id: '1', name: 'Matched Policy' })],
        evaluationPath: [],
        finalEffect: 'allow' as const,
      };

      const actual = policiesReducer(initialState, setTestResult(testResult));

      expect(actual.testResult).toEqual(testResult);
    });

    it('should set new test context', () => {
      const state = {
        ...initialState,
        testResult: {
          allowed: true,
          matchedPolicies: [],
          evaluationPath: [],
          finalEffect: 'allow' as const,
        },
      };

      const newContext = {
        subject: { role: 'user' },
        resource: { type: 'product' },
        action: 'write',
        environment: {},
      };

      const actual = policiesReducer(state, setTestContext(newContext));

      expect(actual.testContext).toEqual(newContext);
      // Note: setTestContext doesn't clear testResult in the actual implementation
      expect(actual.testResult).toEqual(state.testResult);
    });
  });

  describe('loading and error states', () => {
    it('should handle setLoading', () => {
      const actual = policiesReducer(initialState, setLoading(true));
      expect(actual.isLoading).toBe(true);

      const actual2 = policiesReducer(actual, setLoading(false));
      expect(actual2.isLoading).toBe(false);
    });

    it('should handle setError', () => {
      const error = 'Something went wrong';
      const actual = policiesReducer(initialState, setError(error));
      expect(actual.error).toBe(error);

      const actual2 = policiesReducer(actual, setError(null));
      expect(actual2.error).toBe(null);
    });
  });

  describe('complex scenarios', () => {
    it('should maintain policy order by priority', () => {
      const policies = [
        mockPolicy({ id: '1', name: 'A', priority: 10 }),
        mockPolicy({ id: '2', name: 'B', priority: 50 }),
        mockPolicy({ id: '3', name: 'C', priority: 90 }),
      ];

      const updatedPolicy = mockPolicy({ id: '2', name: 'B Updated', priority: 50 });

      const actual = policiesReducer({ ...initialState, policies }, updatePolicy(updatedPolicy));

      expect(actual.policies).toHaveLength(3);
      expect(actual.policies[0].id).toBe('1');
      expect(actual.policies[1]).toEqual(updatedPolicy);
      expect(actual.policies[2].id).toBe('3');
    });

    it('should handle empty policies list', () => {
      const actual = policiesReducer(initialState, setPolicies([]));

      expect(actual.policies).toEqual([]);
    });

    it('should preserve test state during policy operations', () => {
      const testContext = {
        subject: { role: 'admin' },
        resource: { type: 'organization' },
        action: 'read',
        environment: {},
      };

      const testResult = {
        allowed: false,
        matchedPolicies: [],
        evaluationPath: [],
        finalEffect: 'deny' as const,
      };

      const state = {
        ...initialState,
        testContext,
        testResult,
      };

      const newPolicy = mockPolicy({ id: '3' });
      const actual = policiesReducer(state, addPolicy(newPolicy));

      expect(actual.testContext).toEqual(testContext);
      expect(actual.testResult).toEqual(testResult);
    });

    it('should handle policies with same priority', () => {
      const policies = [
        mockPolicy({ id: '1', name: 'Policy A', priority: 50 }),
        mockPolicy({ id: '2', name: 'Policy B', priority: 50 }),
      ];

      const actual = policiesReducer(initialState, setPolicies(policies));

      expect(actual.policies).toHaveLength(2);
      expect(actual.policies[0].priority).toBe(50);
      expect(actual.policies[1].priority).toBe(50);
    });

    it('should clear error on successful operations', () => {
      const stateWithError = {
        ...initialState,
        error: 'Previous error',
      };

      const policies = [mockPolicy()];
      const actual = policiesReducer(stateWithError, setPolicies(policies));

      expect(actual.error).toBe(null);
    });
  });
});
