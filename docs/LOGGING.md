# Logging System Documentation

## Overview
The SAAS Template uses Winston for comprehensive logging throughout the backend application. The logging system provides structured logging, performance monitoring, and detailed request/response tracking.

## Features

### 1. Structured Logging
- JSON format for easy parsing and querying
- Contextual information with every log entry
- Automatic timestamp and metadata inclusion

### 2. Multiple Log Levels
- **error**: Error events that might still allow the application to continue running
- **warn**: Potentially harmful situations
- **info**: Informational messages that highlight progress
- **http**: HTTP request logging
- **verbose**: Detailed information typically only of interest when diagnosing problems
- **debug**: Fine-grained informational events useful for debugging

### 3. Log Outputs
- **Console**: Color-coded output for development
- **Daily Rotate Files**: Automatic log rotation with compression
  - `logs/error-YYYY-MM-DD.log`: Error logs only
  - `logs/combined-YYYY-MM-DD.log`: All logs

### 4. Performance Monitoring
- Automatic slow query detection
- Request duration tracking
- Method execution time logging

## Configuration

### Environment Variables
```bash
# Log level (error, warn, info, http, verbose, debug)
LOG_LEVEL=debug

# Maximum log file retention
LOG_MAX_FILES=30d

# Maximum size per log file
LOG_MAX_SIZE=20m
```

## Usage

### Basic Logging

```typescript
import { LoggerService } from '@/common/logger/logger.service';

@Injectable()
export class MyService {
  constructor(private logger: LoggerService) {
    this.logger.setContext('MyService');
  }

  someMethod() {
    // Info log
    this.logger.log('Processing request');
    
    // Warning log
    this.logger.warn('Low memory detected');
    
    // Error log
    this.logger.error('Failed to process', error.stack);
    
    // Debug log
    this.logger.debug('Detailed information', { data });
  }
}
```

### Method Decorators

```typescript
import { Log, LogPerformance } from '@/common/decorators/log.decorator';

export class MyService {
  @Log('info') // Automatically log method execution
  async processData(data: any) {
    // Method implementation
  }

  @LogPerformance(1000) // Log if execution takes > 1 second
  async slowOperation() {
    // Method implementation
  }
}
```

### Specialized Logging Methods

```typescript
// HTTP Request logging
this.logger.logHttpRequest({
  method: 'GET',
  url: '/api/users',
  ip: '192.168.1.1',
  userId: 'user123',
  duration: 150,
  statusCode: 200
});

// Database query logging
this.logger.logQuery({
  sql: 'SELECT * FROM users WHERE id = $1',
  parameters: ['123'],
  duration: 45
});

// Authentication event logging
this.logger.logAuth({
  type: 'login',
  userId: 'user123',
  email: 'user@example.com',
  ip: '192.168.1.1'
});

// Policy evaluation logging
this.logger.logPolicyEvaluation({
  policyName: 'AdminAccess',
  userId: 'user123',
  resource: 'organization:read',
  action: 'read',
  result: 'allow',
  duration: 12
});

// Business event logging
this.logger.logBusinessEvent({
  type: 'order_created',
  entityType: 'order',
  entityId: 'order123',
  userId: 'user123',
  organizationId: 'org456',
  metadata: { amount: 99.99 }
});
```

### Child Loggers

Create child loggers with additional context:

```typescript
const requestLogger = this.logger.child({
  requestId: 'req123',
  userId: 'user456'
});

requestLogger.log('Processing user request');
// Logs will include requestId and userId in metadata
```

## Interceptors

### LoggingInterceptor
Automatically logs all HTTP requests and responses:
- Request method, URL, body (sanitized)
- Response status code and duration
- Error details for failed requests

### PerformanceInterceptor
Monitors request performance:
- Logs warnings for requests exceeding threshold (default: 1 second)
- Helps identify performance bottlenecks

## Exception Handling

The `AllExceptionsFilter` ensures all unhandled exceptions are logged with:
- Full error stack trace
- Request context
- User information (if authenticated)

## TypeORM Integration

Custom TypeORM logger provides:
- Query logging with parameters
- Slow query detection
- Schema and migration logging

## Log Rotation

Logs are automatically rotated daily with:
- Compression of old log files
- Automatic cleanup based on `LOG_MAX_FILES` setting
- Size-based rotation when files exceed `LOG_MAX_SIZE`

## Security Considerations

### Sensitive Data
The logging system automatically redacts sensitive fields:
- password
- token
- refreshToken
- accessToken
- secret
- apiKey
- creditCard
- ssn

### Production Recommendations
1. Set `LOG_LEVEL=warn` or `LOG_LEVEL=error` in production
2. Enable log aggregation service integration
3. Implement log monitoring and alerting
4. Regularly review and archive logs

## Troubleshooting

### Common Issues

1. **Logs not appearing**
   - Check `LOG_LEVEL` environment variable
   - Ensure write permissions for `logs/` directory

2. **Performance impact**
   - Reduce log level in production
   - Disable query logging for high-traffic applications

3. **Large log files**
   - Adjust `LOG_MAX_SIZE` and `LOG_MAX_FILES`
   - Enable compression for archived logs

## Best Practices

1. **Use appropriate log levels**
   - Error: Application errors requiring attention
   - Warn: Unusual situations that don't prevent operation
   - Info: Important business events
   - Debug: Detailed information for troubleshooting

2. **Include context**
   - Always set logger context in services
   - Include relevant IDs (user, organization, entity)
   - Add metadata that aids in troubleshooting

3. **Performance considerations**
   - Avoid logging in tight loops
   - Use debug level for verbose logging
   - Consider async logging for high-throughput scenarios

4. **Structured data**
   - Log objects instead of concatenated strings
   - Use consistent field names across services
   - Include correlation IDs for distributed tracing