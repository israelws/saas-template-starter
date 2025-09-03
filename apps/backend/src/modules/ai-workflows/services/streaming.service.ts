import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Service for handling streaming responses in workflows
 */
@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private activeStreams = new Map<string, any>();

  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Send a token to the stream
   */
  async sendToken(executionId: string, token: string): Promise<void> {
    this.logger.debug(`Sending token for execution ${executionId}`);
    
    // Emit token event
    this.eventEmitter.emit('workflow.stream.token', {
      executionId,
      token,
      timestamp: new Date(),
    });
  }

  /**
   * Start a new stream
   */
  startStream(executionId: string): void {
    this.logger.debug(`Starting stream for execution ${executionId}`);
    this.activeStreams.set(executionId, {
      startTime: Date.now(),
      tokens: [],
    });
  }

  /**
   * End a stream
   */
  endStream(executionId: string): void {
    this.logger.debug(`Ending stream for execution ${executionId}`);
    this.activeStreams.delete(executionId);
  }

  /**
   * Check if stream is active
   */
  isStreamActive(executionId: string): boolean {
    return this.activeStreams.has(executionId);
  }

  /**
   * Get stream data
   */
  getStreamData(executionId: string): any {
    return this.activeStreams.get(executionId);
  }
}