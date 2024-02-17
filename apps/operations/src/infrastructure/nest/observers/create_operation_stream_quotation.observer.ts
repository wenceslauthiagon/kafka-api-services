import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  RedisService,
} from '@zro/common';
import { KAFKA_EVENTS } from '@zro/quotations/infrastructure';
import {
  HandleCreateOperationStreamQuotationEventController,
  HandleCreateOperationStreamQuotationEventRequest,
} from '@zro/operations/interface';
import { OperationStreamQuotationRedisRepository } from '@zro/operations/infrastructure';

export type HandleCreateOperationStreamQuotationEventKafkaRequest =
  KafkaMessage<HandleCreateOperationStreamQuotationEventRequest[]>;

export interface CreateOperationStreamQuotationConfig {
  APP_OPERATION_STREAM_QUOTATION_DEFAULT_TTL_MS: number;
}

/**
 * Create stream quotation quotations events observer.
 */
@Controller()
@ObserverController()
export class CreateOperationStreamQuotationNestObserver {
  private readonly operationStreamQuotationRedisRepository: OperationStreamQuotationRedisRepository;
  private readonly operationStreamQuotationTTL: number;

  constructor(
    private configService: ConfigService<CreateOperationStreamQuotationConfig>,
    private readonly redisService: RedisService,
  ) {
    this.operationStreamQuotationTTL = Number(
      this.configService.get<number>(
        'APP_OPERATION_STREAM_QUOTATION_DEFAULT_TTL_MS',
        10000,
      ),
    );

    this.operationStreamQuotationRedisRepository =
      new OperationStreamQuotationRedisRepository(
        this.redisService,
        this.operationStreamQuotationTTL,
      );
  }
  /**
   * Handle create stream quotation event.
   *
   * @param logger Local logger instance.
   * @param message Event Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.STREAM_QUOTATION.CREATED)
  async execute(
    @LoggerParam(CreateOperationStreamQuotationNestObserver)
    logger: Logger,
    @Payload('value')
    message: HandleCreateOperationStreamQuotationEventRequest[],
  ): Promise<void> {
    logger.debug('Received message.', { quantityQuotations: message.length });

    // Parse kafka message.
    const payload = message.map(
      (el) => new HandleCreateOperationStreamQuotationEventRequest(el),
    );

    // Create create controller.
    const controller = new HandleCreateOperationStreamQuotationEventController(
      logger,
      this.operationStreamQuotationRedisRepository,
    );

    // Create operation stream quotation.
    await controller.execute(payload);

    logger.debug('Operation stream quotation created.');
  }
}
