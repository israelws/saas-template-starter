import { LoggerService } from '../logger/logger.service';

/**
 * Method decorator for automatic logging
 */
export function Log(level: 'debug' | 'info' | 'warn' | 'error' = 'debug') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = new LoggerService(target.constructor.name);
      const startTime = Date.now();

      try {
        logger[level](`Executing ${propertyName}`, {
          method: propertyName,
          args: args.length > 0 ? args : undefined,
        });

        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logger[level](`Completed ${propertyName}`, {
          method: propertyName,
          duration,
          hasResult: !!result,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error({
          message: `Failed ${propertyName}`,
          method: propertyName,
          duration,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : error,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Method decorator for performance logging
 */
export function LogPerformance(thresholdMs: number = 100) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = new LoggerService(target.constructor.name);
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        if (duration > thresholdMs) {
          logger.warn({
            message: `Slow method execution: ${propertyName}`,
            method: propertyName,
            duration,
            threshold: thresholdMs,
          });
        } else {
          logger.debug({
            message: `Method execution: ${propertyName}`,
            method: propertyName,
            duration,
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error({
          message: `Method failed: ${propertyName}`,
          method: propertyName,
          duration,
          error: error instanceof Error ? error.message : error,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Class decorator for automatic logging of all methods
 */
export function LogClass(level: 'debug' | 'info' | 'warn' | 'error' = 'debug') {
  return function (target: any) {
    for (const propertyName of Object.getOwnPropertyNames(target.prototype)) {
      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, propertyName);
      const isMethod = descriptor?.value instanceof Function;

      if (!isMethod || propertyName === 'constructor') {
        continue;
      }

      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const logger = new LoggerService(target.name);

        try {
          logger[level]({ message: `${target.name}.${propertyName} called` });
          const result = await originalMethod.apply(this, args);
          return result;
        } catch (error) {
          logger.error({ message: `${target.name}.${propertyName} failed`, error });
          throw error;
        }
      };

      Object.defineProperty(target.prototype, propertyName, descriptor);
    }
  };
}
