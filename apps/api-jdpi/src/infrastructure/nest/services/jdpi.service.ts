import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  HandleNotifyCreditDepositJdpiEventKafkaRequest,
  HandleNotifyCreditDevolutionJdpiEventKafkaRequest,
  HandleNotifyCreditValidationJdpiEventKafkaRequest,
  KAFKA_EVENTS,
} from '@zro/api-jdpi/infrastructure';
import {
  THandleNotifyCreditDepositJdpiEventRequest,
  THandleNotifyCreditDevolutionJdpiEventRequest,
  THandleNotifyCreditValidationJdpiEventRequest,
} from '@zro/api-jdpi/interface';

/**
 * Send to own api-jdpi microservice.
 */
@Injectable()
export class JdpiServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: JdpiServiceKafka.name });
    this.kafkaService.subscribe([
      KAFKA_EVENTS.JDPI.NOTIFY_CREDIT,
      KAFKA_EVENTS.JDPI.NOTIFY_DEVOLUTION,
      KAFKA_EVENTS.JDPI.NOTIFY_CREDIT_VALIDATION,
    ]);
  }

  /**
   * Call own api-jdpi microservice to notify a new credit deposit.
   * @param requestId Unique shared request ID.
   * @param payload The credit deposit data.
   */
  async notifyCreditDeposit(
    requestId: string,
    payload: THandleNotifyCreditDepositJdpiEventRequest,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyCreditDepositJdpiEventKafkaRequest = {
      key: requestId,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify credit deposit message.', { data });

    // Call ApiJdpi microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyCreditDepositJdpiEventKafkaRequest>(
        KAFKA_EVENTS.JDPI.NOTIFY_CREDIT,
        data,
      );

    logger.debug('Notify credit deposit message sent.', { result });
  }

  /**
   * Call own api-jdpi microservice to notify a credit devolution.
   * @param requestId Unique shared request ID.
   * @param payload The credit devolution data.
   */
  async notifyCreditDevolution(
    requestId: string,
    payload: THandleNotifyCreditDevolutionJdpiEventRequest,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyCreditDevolutionJdpiEventKafkaRequest = {
      key: requestId,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify credit devolution message.', { data });

    // Call ApiJdpi microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyCreditDevolutionJdpiEventKafkaRequest>(
        KAFKA_EVENTS.JDPI.NOTIFY_DEVOLUTION,
        data,
      );

    logger.debug('Notify credit devolution message sent.', { result });
  }

  /**
   * Call own api-jdpi microservice to notify a credit validation.
   * @param requestId Unique shared request ID.
   * @param payload The credit validation data.
   */
  async notifyCreditValidation(
    requestId: string,
    payload: THandleNotifyCreditValidationJdpiEventRequest,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyCreditValidationJdpiEventKafkaRequest = {
      key: requestId,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify credit validation message.', { data });

    // Call ApiJdpi microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyCreditValidationJdpiEventKafkaRequest>(
        KAFKA_EVENTS.JDPI.NOTIFY_CREDIT_VALIDATION,
        data,
      );

    logger.debug('Notify credit validation message sent.', { result });
  }
}
