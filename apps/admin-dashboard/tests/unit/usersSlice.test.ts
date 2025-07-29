import usersReducer, {
  setUsers,
  setSelectedUser,
  addUser,
  updateUser,
  deleteUser,
  setFilters,
  setLoading,
  setError,
} from '../userSlice';
import { mockUser } from '@/test-utils';

describe('usersSlice', () => {
  const initialState = {
    users: [],
    selectedUser: null,
    filters: {},
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(usersReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('users management', () => {
    it('should handle setUsers', () => {
      const users = [
        mockUser({ id: '1', email: 'user1@example.com' }),
        mockUser({ id: '2', email: 'user2@example.com' }),
      ];

      const actual = usersReducer(initialState, setUsers(users));

      expect(actual.users).toEqual(users);
    });

    it('should handle setSelectedUser', () => {
      const user = mockUser({ id: '1', email: 'test@example.com' });

      const actual = usersReducer(initialState, setSelectedUser(user));

      expect(actual.selectedUser).toEqual(user);
    });

    it('should handle addUser', () => {
      const existingUsers = [mockUser({ id: '1', email: 'user1@example.com' })];
      const newUser = mockUser({ id: '2', email: 'newuser@example.com' });

      const actual = usersReducer({ ...initialState, users: existingUsers }, addUser(newUser));

      expect(actual.users).toEqual([...existingUsers, newUser]);
    });

    it('should handle updateUser', () => {
      const existingUsers = [
        mockUser({ id: '1', email: 'user1@example.com', firstName: 'John' }),
        mockUser({ id: '2', email: 'user2@example.com', firstName: 'Jane' }),
      ];
      const updatedUser = mockUser({
        id: '1',
        email: 'user1@example.com',
        firstName: 'Jonathan',
      });

      const actual = usersReducer(
        { ...initialState, users: existingUsers },
        updateUser(updatedUser),
      );

      expect(actual.users[0]).toEqual(updatedUser);
      expect(actual.users[1]).toEqual(existingUsers[1]);
    });

    it('should update selectedUser if it matches', () => {
      const selectedUser = mockUser({ id: '1', email: 'user1@example.com' });
      const updatedUser = mockUser({
        id: '1',
        email: 'user1@example.com',
        firstName: 'Updated',
      });

      const actual = usersReducer(
        {
          ...initialState,
          users: [selectedUser],
          selectedUser,
        },
        updateUser(updatedUser),
      );

      expect(actual.selectedUser).toEqual(updatedUser);
    });

    it('should handle deleteUser', () => {
      const existingUsers = [
        mockUser({ id: '1', email: 'user1@example.com' }),
        mockUser({ id: '2', email: 'user2@example.com' }),
      ];

      const actual = usersReducer({ ...initialState, users: existingUsers }, deleteUser('1'));

      expect(actual.users).toEqual([existingUsers[1]]);
    });

    it('should clear selectedUser if it was deleted', () => {
      const selectedUser = mockUser({ id: '1', email: 'user1@example.com' });

      const actual = usersReducer(
        {
          ...initialState,
          users: [selectedUser],
          selectedUser,
        },
        deleteUser('1'),
      );

      expect(actual.selectedUser).toBe(null);
    });
  });

  describe('filters management', () => {
    it('should handle setFilters', () => {
      const filters = {
        search: 'john',
        organizationId: 'org-123',
        status: 'active',
      };

      const actual = usersReducer(initialState, setFilters(filters));
      expect(actual.filters).toEqual(filters);
    });

    it('should handle filter replacement', () => {
      const state = {
        ...initialState,
        filters: {
          search: 'john',
          organizationId: 'org-123',
          status: 'active',
        },
      };

      const actual = usersReducer(state, setFilters({ search: 'jane' }));

      expect(actual.filters).toEqual({
        search: 'jane',
      });
    });
  });

  describe('loading and error states', () => {
    it('should handle setLoading', () => {
      const actual = usersReducer(initialState, setLoading(true));
      expect(actual.isLoading).toBe(true);

      const actual2 = usersReducer(actual, setLoading(false));
      expect(actual2.isLoading).toBe(false);
    });

    it('should handle setError', () => {
      const error = 'Something went wrong';
      const actual = usersReducer(initialState, setError(error));
      expect(actual.error).toBe(error);

      const actual2 = usersReducer(actual, setError(null));
      expect(actual2.error).toBe(null);
    });
  });

  describe('complex scenarios', () => {
    it('should maintain user order when updating', () => {
      const users = [
        mockUser({ id: '1', email: 'a@example.com' }),
        mockUser({ id: '2', email: 'b@example.com' }),
        mockUser({ id: '3', email: 'c@example.com' }),
      ];

      const updatedUser = mockUser({ id: '2', email: 'b-updated@example.com' });

      const actual = usersReducer({ ...initialState, users }, updateUser(updatedUser));

      expect(actual.users).toHaveLength(3);
      expect(actual.users[0].id).toBe('1');
      expect(actual.users[1]).toEqual(updatedUser);
      expect(actual.users[2].id).toBe('3');
    });

    it('should handle empty users list', () => {
      const actual = usersReducer(initialState, setUsers([]));

      expect(actual.users).toEqual([]);
    });

    it('should preserve other state properties during updates', () => {
      const state = {
        users: [mockUser({ id: '1' })],
        selectedUser: mockUser({ id: '2' }),
        filters: {
          search: 'test',
          organizationId: 'org-123',
          status: 'active',
        },
        isLoading: false,
        error: null,
      };

      const newUser = mockUser({ id: '3' });
      const actual = usersReducer(state, addUser(newUser));

      expect(actual.selectedUser).toEqual(state.selectedUser);
      expect(actual.filters).toEqual(state.filters);
      expect(actual.users).toHaveLength(2);
    });

    it('should handle users with same email but different ids', () => {
      const users = [
        mockUser({ id: '1', email: 'duplicate@example.com' }),
        mockUser({ id: '2', email: 'duplicate@example.com' }),
      ];

      const actual = usersReducer(initialState, setUsers(users));

      expect(actual.users).toHaveLength(2);
      expect(actual.users[0].id).toBe('1');
      expect(actual.users[1].id).toBe('2');
    });
  });
});
