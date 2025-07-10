import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorDto {
  @ApiProperty({
    description: 'The field that failed validation',
    example: 'email'
  })
  field: string;

  @ApiProperty({
    description: 'Array of validation constraint messages',
    example: ['email must be a valid email address']
  })
  constraints: string[];

  @ApiProperty({
    description: 'The value that failed validation',
    example: 'invalid-email',
    required: false
  })
  value?: any;
}

export class ErrorDetailsDto {
  @ApiProperty({
    description: 'Total number of validation errors',
    example: 2,
    required: false
  })
  totalErrors?: number;

  @ApiProperty({
    description: 'List of fields that failed validation',
    example: ['email', 'password'],
    required: false
  })
  failedFields?: string[];

  @ApiProperty({
    description: 'Database constraint information',
    example: 'unique_email_constraint',
    required: false
  })
  constraint?: string;

  @ApiProperty({
    description: 'Duplicate key information for database conflicts',
    example: 'email=user@example.com',
    required: false
  })
  duplicateKey?: string;

  @ApiProperty({
    description: 'Required permission for ABAC errors',
    example: 'organization:write',
    required: false
  })
  requiredPermission?: string;

  @ApiProperty({
    description: 'Resource being accessed',
    example: 'organization/123',
    required: false
  })
  resource?: string;

  @ApiProperty({
    description: 'Organization ID for organization-specific errors',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  organizationId?: string;

  @ApiProperty({
    description: 'User ID for user-specific errors',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  userId?: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error type/code',
    example: 'VALIDATION_FAILED'
  })
  error: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Request validation failed'
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-01-01T00:00:00.000Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path that caused the error',
    example: '/api/organizations'
  })
  path: string;

  @ApiProperty({
    description: 'HTTP method used',
    example: 'POST'
  })
  method: string;

  @ApiProperty({
    description: 'Validation errors for request validation failures',
    type: [ValidationErrorDto],
    required: false
  })
  validationErrors?: ValidationErrorDto[];

  @ApiProperty({
    description: 'Additional error details',
    type: ErrorDetailsDto,
    required: false
  })
  details?: ErrorDetailsDto;

  @ApiProperty({
    description: 'Original error message (development only)',
    example: 'Column "email" cannot be null',
    required: false
  })
  originalError?: string;

  @ApiProperty({
    description: 'Stack trace (development only)',
    example: 'Error: Validation failed\n    at ...',
    required: false
  })
  stack?: string;
}

export class ApiErrorResponses {
  static readonly BadRequest = {
    status: 400,
    description: 'Bad Request - Invalid input data',
    type: ErrorResponseDto,
    examples: {
      validation: {
        summary: 'Validation Error',
        value: {
          statusCode: 400,
          error: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/api/organizations',
          method: 'POST',
          validationErrors: [
            {
              field: 'name',
              constraints: ['name should not be empty'],
              value: ''
            }
          ],
          details: {
            totalErrors: 1,
            failedFields: ['name']
          }
        }
      },
      duplicate: {
        summary: 'Duplicate Entry',
        value: {
          statusCode: 400,
          error: 'DUPLICATE_ENTRY',
          message: 'Resource already exists',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/api/organizations',
          method: 'POST',
          details: {
            constraint: 'unique_organization_code',
            duplicateKey: 'code=ACME'
          }
        }
      }
    }
  };

  static readonly Unauthorized = {
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
    example: {
      statusCode: 401,
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
      timestamp: '2024-01-01T00:00:00.000Z',
      path: '/api/organizations',
      method: 'GET'
    }
  };

  static readonly Forbidden = {
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
    examples: {
      permissions: {
        summary: 'Insufficient Permissions',
        value: {
          statusCode: 403,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to perform this action',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/api/organizations/123',
          method: 'DELETE',
          details: {
            requiredPermission: 'organization:delete',
            resource: 'organization/123'
          }
        }
      },
      organization: {
        summary: 'Organization Access Denied',
        value: {
          statusCode: 403,
          error: 'ORGANIZATION_ACCESS_DENIED',
          message: 'Access denied to organization resource',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/api/organizations/123',
          method: 'GET',
          details: {
            organizationId: '123e4567-e89b-12d3-a456-426614174000',
            userId: '987fcdeb-51a2-43d1-9f12-123456789abc'
          }
        }
      }
    }
  };

  static readonly NotFound = {
    status: 404,
    description: 'Not Found - Resource does not exist',
    type: ErrorResponseDto,
    example: {
      statusCode: 404,
      error: 'ENTITY_NOT_FOUND',
      message: 'Resource not found',
      timestamp: '2024-01-01T00:00:00.000Z',
      path: '/api/organizations/123',
      method: 'GET'
    }
  };

  static readonly Conflict = {
    status: 409,
    description: 'Conflict - Resource state conflict',
    type: ErrorResponseDto,
    example: {
      statusCode: 409,
      error: 'DUPLICATE_ENTRY',
      message: 'Resource already exists',
      timestamp: '2024-01-01T00:00:00.000Z',
      path: '/api/organizations',
      method: 'POST',
      details: {
        constraint: 'unique_organization_code',
        duplicateKey: 'code=ACME'
      }
    }
  };

  static readonly InternalServerError = {
    status: 500,
    description: 'Internal Server Error - Unexpected server error',
    type: ErrorResponseDto,
    example: {
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      timestamp: '2024-01-01T00:00:00.000Z',
      path: '/api/organizations',
      method: 'POST'
    }
  };
}