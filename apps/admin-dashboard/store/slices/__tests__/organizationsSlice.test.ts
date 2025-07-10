import organizationsReducer, {
  setOrganizations,
  setCurrentOrganization,
  addOrganization,
  updateOrganization,
  deleteOrganization,
  setLoading,
  setError,
} from '../organizationSlice';
import { mockOrganization } from '@/test-utils';

describe('organizationsSlice', () => {
  const initialState = {
    organizations: [],
    currentOrganization: null,
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(organizationsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('organizations management', () => {
    it('should handle setOrganizations', () => {
      const organizations = [
        mockOrganization({ id: '1', name: 'Org 1' }),
        mockOrganization({ id: '2', name: 'Org 2' }),
      ];

      const actual = organizationsReducer(initialState, setOrganizations(organizations));

      expect(actual.organizations).toEqual(organizations);
    });

    it('should handle setCurrentOrganization', () => {
      const organization = mockOrganization({ id: '1', name: 'Test Org' });

      const actual = organizationsReducer(initialState, setCurrentOrganization(organization));

      expect(actual.currentOrganization).toEqual(organization);
    });

    it('should handle addOrganization', () => {
      const existingOrgs = [mockOrganization({ id: '1', name: 'Org 1' })];
      const newOrg = mockOrganization({ id: '2', name: 'New Org' });

      const actual = organizationsReducer(
        { ...initialState, organizations: existingOrgs },
        addOrganization(newOrg),
      );

      expect(actual.organizations).toEqual([...existingOrgs, newOrg]);
    });

    it('should handle updateOrganization', () => {
      const existingOrgs = [
        mockOrganization({ id: '1', name: 'Org 1' }),
        mockOrganization({ id: '2', name: 'Org 2' }),
      ];
      const updatedOrg = mockOrganization({ id: '1', name: 'Updated Org 1' });

      const actual = organizationsReducer(
        { ...initialState, organizations: existingOrgs },
        updateOrganization(updatedOrg),
      );

      expect(actual.organizations[0]).toEqual(updatedOrg);
      expect(actual.organizations[1]).toEqual(existingOrgs[1]);
    });

    it('should update currentOrganization if it matches', () => {
      const currentOrg = mockOrganization({ id: '1', name: 'Org 1' });
      const updatedOrg = mockOrganization({ id: '1', name: 'Updated Org 1' });

      const actual = organizationsReducer(
        {
          ...initialState,
          organizations: [currentOrg],
          currentOrganization: currentOrg,
        },
        updateOrganization(updatedOrg),
      );

      expect(actual.currentOrganization).toEqual(updatedOrg);
    });

    it('should handle deleteOrganization', () => {
      const existingOrgs = [
        mockOrganization({ id: '1', name: 'Org 1' }),
        mockOrganization({ id: '2', name: 'Org 2' }),
      ];

      const actual = organizationsReducer(
        { ...initialState, organizations: existingOrgs },
        deleteOrganization('1'),
      );

      expect(actual.organizations).toEqual([existingOrgs[1]]);
    });

    it('should clear currentOrganization if it was deleted', () => {
      const currentOrg = mockOrganization({ id: '1', name: 'Org 1' });

      const actual = organizationsReducer(
        {
          ...initialState,
          organizations: [currentOrg],
          currentOrganization: currentOrg,
        },
        deleteOrganization('1'),
      );

      expect(actual.currentOrganization).toBe(null);
    });
  });

  describe('loading and error states', () => {
    it('should handle setLoading', () => {
      const actual = organizationsReducer(initialState, setLoading(true));
      expect(actual.isLoading).toBe(true);

      const actual2 = organizationsReducer(actual, setLoading(false));
      expect(actual2.isLoading).toBe(false);
    });

    it('should handle setError', () => {
      const error = 'Something went wrong';
      const actual = organizationsReducer(initialState, setError(error));
      expect(actual.error).toBe(error);

      const actual2 = organizationsReducer(actual, setError(null));
      expect(actual2.error).toBe(null);
    });
  });

  describe('complex scenarios', () => {
    it('should maintain organization order when updating', () => {
      const orgs = [
        mockOrganization({ id: '1', name: 'A' }),
        mockOrganization({ id: '2', name: 'B' }),
        mockOrganization({ id: '3', name: 'C' }),
      ];

      const updatedOrg = mockOrganization({ id: '2', name: 'B Updated' });

      const actual = organizationsReducer(
        { ...initialState, organizations: orgs },
        updateOrganization(updatedOrg),
      );

      expect(actual.organizations).toHaveLength(3);
      expect(actual.organizations[0].id).toBe('1');
      expect(actual.organizations[1]).toEqual(updatedOrg);
      expect(actual.organizations[2].id).toBe('3');
    });

    it('should handle empty organizations list', () => {
      const actual = organizationsReducer(initialState, setOrganizations([]));

      expect(actual.organizations).toEqual([]);
    });

    it('should preserve other state properties during updates', () => {
      const state = {
        organizations: [mockOrganization({ id: '1' })],
        currentOrganization: mockOrganization({ id: '2' }),
        isLoading: false,
        error: null,
      };

      const newOrg = mockOrganization({ id: '3' });
      const actual = organizationsReducer(state, addOrganization(newOrg));

      expect(actual.currentOrganization).toEqual(state.currentOrganization);
      expect(actual.organizations).toHaveLength(2);
    });
  });
});
