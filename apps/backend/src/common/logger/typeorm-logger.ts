import { Logger, QueryRunner } from 'typeorm';
import { LoggerService } from './logger.service';

export class TypeOrmLogger implements Logger {
  private logger: LoggerService;

  constructor() {
    this.logger = new LoggerService('TypeORM');
  }

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const sql = this.formatQuery(query, parameters);
    this.logger.logQuery({
      sql,
      parameters,
    });
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    const sql = this.formatQuery(query, parameters);
    this.logger.logQuery({
      sql,
      parameters,
      error: error instanceof Error ? error.message : error,
    });
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const sql = this.formatQuery(query, parameters);
    this.logger.warn({ message: 'Slow query detected', sql, parameters, duration: time });
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`Schema build: ${message}`);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`Migration: ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    switch (level) {
      case 'log':
      case 'info':
        this.logger.log(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
    }
  }

  private formatQuery(query: string, parameters?: any[]): string {
    if (!parameters || parameters.length === 0) {
      return query;
    }

    // Simple parameter replacement for logging
    let formattedQuery = query;
    parameters.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      const value = typeof param === 'string' ? `'${param}'` : param;
      formattedQuery = formattedQuery.replace(placeholder, value);
    });

    return formattedQuery;
  }
}
