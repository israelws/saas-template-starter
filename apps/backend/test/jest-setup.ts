// Jest setup file for backend testing
import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../.env.test') });

// Global test timeout
jest.setTimeout(30000);

// Mock external services in test environment
if (process.env.NODE_ENV === 'test') {
  // Mock AWS SDK v3 services
  jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        User: {
          Username: 'test-user',
          UserStatus: 'CONFIRMED',
          Attributes: [
            { Name: 'email', Value: 'test@example.com' },
            { Name: 'given_name', Value: 'Test' },
            { Name: 'family_name', Value: 'User' }
          ]
        }
      })
    })),
    AdminCreateUserCommand: jest.fn(),
    AdminGetUserCommand: jest.fn(),
    AdminDeleteUserCommand: jest.fn(),
    InitiateAuthCommand: jest.fn(),
    RespondToAuthChallengeCommand: jest.fn(),
    ForgotPasswordCommand: jest.fn(),
    ConfirmForgotPasswordCommand: jest.fn()
  }));

  // Mock Redis and cache-manager
  jest.mock('cache-manager-redis-yet', () => ({
    redisStore: jest.fn().mockResolvedValue({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      keys: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      mdel: jest.fn()
    })
  }));
  
  jest.mock('redis', () => ({
    createClient: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      flushAll: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined)
    })
  }));
}

// Global test database cleanup
beforeEach(() => {
  // Clear any module registry between tests
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});