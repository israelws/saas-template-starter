import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [
    {
      provide: LoggerService,
      useValue: new LoggerService('Application'),
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
