import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Logger } from 'winston';
import { DefaultEvent, DefaultEventEmitter } from '../helpers/event.helper';
import { KafkaService } from '../modules/kafka.module';
import { NotImplementedException } from '../exceptions/not_implemented.exception';
import { NullPointerException } from '../exceptions/null_pointer.exception';
import { ProtocolType } from '../helpers/protocol.helper';

/**
 * Fire events to kafka after next handler.
 */
export class KafkaEventEmitter implements DefaultEventEmitter {
  /**
   * Store events to be sent to kafka after next handler.
   */
  private events: DefaultEvent[] = [];

  /**
   * Default constructor.
   *
   * @param logger Logger instance.
   * @param kafkaService Service to access kafka.
   */
  constructor(
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: KafkaEventEmitter.name });
  }

  /**
   * Fire event to kafka.
   * @param event Kafka event.
   */
  emit(event: DefaultEvent): Promise<void> | void {
    this.logger.debug('Fired event.', { event });
    this.events.push(event);
  }

  /**
   * Fire event to kafka.
   */
  async fireEvents() {
    if (!this.events.length) {
      this.logger.debug('No events to fire.');
      return;
    }

    const chunk = (arr: any[], size: number) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size),
      );

    const eventChunks = chunk(this.events, 100);
    let count = 0;

    for (const eventChunk of eventChunks) {
      this.logger.debug(
        `Firing events page ${++count} of ${eventChunks.length}`,
      );

      const events = await Promise.allSettled(
        eventChunk.map((event) =>
          this.kafkaService.emit(event.name, event.data),
        ),
      );

      events.forEach((event, i) => {
        if (event.status === 'fulfilled') {
          this.logger.debug('Kafka event fired.', { event: this.events[i] });
        } else {
          this.logger.error('Kafka event NOT fired.', {
            event: this.events[i],
            reason: event.reason,
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

/**
 * Intercepts all events fired and send it to kafka.
 */
@Injectable()
export class KafkaEventInterceptor implements NestInterceptor {
  constructor(private kafkaService: KafkaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Get request.
    let request: any = null;

    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else if (protocol === ProtocolType.RPC) {
      const ctx = context.switchToRpc();
      request = ctx.getContext<KafkaContext>();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    // Sanity check!
    if (!request.logger) {
      throw new NullPointerException(
        'Request logger is not defined. Check if LoggerInterceptor is available.',
      );
    }

    // Create a local logger instance.
    const logger = request.logger.child({
      context: KafkaEventInterceptor.name,
    });

    // All events fired by request will be sent to kafka.
    const emitter = new KafkaEventEmitter(logger, this.kafkaService);

    logger.debug('Kafka emitter created.');

    // Store event emitter to be used by nest controllers.
    request.emitter = emitter;

    if (!request.transaction?.afterCommit) {
      throw new NullPointerException(
        `Database transaction is not defined.
        Check if TransactionInterceptor is available.`,
      );
    }

    // Fire events to kafka after database commit.
    request.transaction.afterCommit(() => {
      logger.debug('Firing kafka events.');
      return emitter.fireEvents();
    });

    return next.handle();
  }
}
