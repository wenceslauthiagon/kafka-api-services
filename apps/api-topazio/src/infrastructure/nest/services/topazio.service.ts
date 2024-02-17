import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  NotifyCompletion,
  NotifyRegisterBankingTed,
  NotifyCredit,
  NotifyDebit,
  NotifyConfirmBankingTed,
} from '@zro/api-topazio/domain';
import {
  KAFKA_EVENTS,
  HandleNotifyClaimTopazioEventKafkaRequest,
  HandleNotifyCompletionTopazioEventKafkaRequest,
  HandleNotifyCreditTopazioEventKafkaRequest,
  HandleNotifyDebitTopazioEventKafkaRequest,
  HandleNotifyRegisterBankingTedTopazioEventKafkaRequest,
  HandleNotifyConfirmBankingTedTopazioEventKafkaRequest,
} from '@zro/api-topazio/infrastructure';
import { HandleNotifyClaimTopazioEventRequest } from '@zro/api-topazio/interface';

/**
 * Send to own api-topazio microservice.
 */
@Injectable()
export class TopazioServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: TopazioServiceKafka.name });
    this.kafkaService.subscribe([
      KAFKA_EVENTS.TOPAZIO.NOTIFY_COMPLETION,
      KAFKA_EVENTS.TOPAZIO.NOTIFY_CREDIT,
      KAFKA_EVENTS.TOPAZIO.NOTIFY_DEBIT,
      KAFKA_EVENTS.TOPAZIO.NOTIFY_CLAIMS,
      KAFKA_EVENTS.TOPAZIO.NOTIFY_REGISTER_BANKING_TED,
      KAFKA_EVENTS.TOPAZIO.NOTIFY_CONFIRM_BANKING_TED,
    ]);
  }

  /**
   * Call own api-topazio microservice to notify a new debit.
   * @param requestId Unique shared request ID.
   * @param payload The debit data.
   */
  async notifyDebit(requestId: string, payload: NotifyDebit): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyDebitTopazioEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify message.', { data });

    // Call ApiTopazio microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyDebitTopazioEventKafkaRequest>(
        KAFKA_EVENTS.TOPAZIO.NOTIFY_DEBIT,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-topazio microservice to notify a new credit.
   * @param requestId Unique shared request ID.
   * @param payload The credit data.
   */
  async notifyCredit(requestId: string, payload: NotifyCredit): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyCreditTopazioEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify message.', { data });

    // Call ApiTopazio microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyCreditTopazioEventKafkaRequest>(
        KAFKA_EVENTS.TOPAZIO.NOTIFY_CREDIT,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-topazio microservice to notify a new completion.
   * @param requestId Unique shared request ID.
   * @param payload The completion data.
   */
  async notifyCompletion(
    requestId: string,
    payload: NotifyCompletion,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyCompletionTopazioEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify message.', { data });

    // Call ApiTopazio microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyCompletionTopazioEventKafkaRequest>(
        KAFKA_EVENTS.TOPAZIO.NOTIFY_COMPLETION,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-topazio microservice to notify a new claims.
   * @param requestId Unique shared request ID.
   * @param payload The claims data.
   */
  async notifyClaims(
    requestId: string,
    payload: HandleNotifyClaimTopazioEventRequest,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyClaimTopazioEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify topazio.', { data });

    // Call ApiTopazio microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyClaimTopazioEventKafkaRequest>(
        KAFKA_EVENTS.TOPAZIO.NOTIFY_CLAIMS,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-topazio microservice to notify a new register banking ted.
   * @param requestId Unique shared request ID.
   * @param payload The completion data.
   */
  async notifyRegisterBankingTed(
    requestId: string,
    payload: NotifyRegisterBankingTed,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyRegisterBankingTedTopazioEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify completion banking ted message.', { data });

    // Call ApiTopazio microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyRegisterBankingTedTopazioEventKafkaRequest>(
        KAFKA_EVENTS.TOPAZIO.NOTIFY_REGISTER_BANKING_TED,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-topazio microservice to notify a new confirm banking ted.
   * @param requestId Unique shared request ID.
   * @param payload The confirm data.
   */
  async notifyConfirmBankingTed(
    requestId: string,
    payload: NotifyConfirmBankingTed,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyConfirmBankingTedTopazioEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify confirm banking ted message.', { data });

    // Call ApiTopazio microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyConfirmBankingTedTopazioEventKafkaRequest>(
        KAFKA_EVENTS.TOPAZIO.NOTIFY_CONFIRM_BANKING_TED,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }
}
