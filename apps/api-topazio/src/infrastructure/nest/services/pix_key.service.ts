import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { KafkaService } from '@zro/common';
import {
  GetByKeyPixKeyServiceResponse,
  PixKeyService,
} from '@zro/api-topazio/application';
import {
  KAFKA_TOPICS,
  CancelOwnershipClaimProcessKafkaRequest,
  CancelPortabilityClaimProcessKafkaRequest,
  CompleteClosingClaimProcessKafkaRequest,
  CompleteOwnershipClaimProcessKafkaRequest,
  CompletePortabilityClaimProcessKafkaRequest,
  ConfirmOwnershipClaimProcessKafkaRequest,
  ConfirmPortabilityClaimProcessKafkaRequest,
  GetByKeyPixKeyKafkaRequest,
  ReadyOwnershipClaimProcessKafkaRequest,
  ReadyPortabilityClaimProcessKafkaRequest,
  WaitOwnershipClaimProcessKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  CancelOwnershipClaimProcessResponse,
  CancelPortabilityClaimProcessResponse,
  CompleteClosingClaimProcessResponse,
  CompleteOwnershipClaimProcessResponse,
  CompletePortabilityClaimProcessResponse,
  ConfirmOwnershipClaimProcessResponse,
  ConfirmPortabilityClaimProcessResponse,
  GetByKeyPixKeyResponse,
  ReadyOwnershipClaimProcessResponse,
  ReadyPortabilityClaimProcessResponse,
  WaitOwnershipClaimProcessResponse,
} from '@zro/pix-keys/interface';

/**
 * Pix microservice.
 */
@Injectable()
export class PixKeyServiceKafkaInit {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.subscribe([
      KAFKA_TOPICS.KEY.CONFIRM_PORTABILITY_PROCESS,
      KAFKA_TOPICS.KEY.COMPLETE_PORTABILITY_PROCESS,
      KAFKA_TOPICS.KEY.CANCEL_PORTABILITY_PROCESS,
      KAFKA_TOPICS.KEY.WAIT_OWNERSHIP_PROCESS,
      KAFKA_TOPICS.KEY.CONFIRM_OWNERSHIP_PROCESS,
      KAFKA_TOPICS.KEY.COMPLETE_OWNERSHIP_PROCESS,
      KAFKA_TOPICS.KEY.CANCEL_OWNERSHIP_PROCESS,
      KAFKA_TOPICS.KEY.COMPLETE_CLAIM_CLOSING,
      KAFKA_TOPICS.KEY.READY_PORTABILITY_PROCESS,
      KAFKA_TOPICS.KEY.READY_OWNERSHIP_PROCESS,
      KAFKA_TOPICS.KEY.GET_BY_KEY,
    ]);
  }
}

export class PixKeyServiceKafka implements PixKeyService {
  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: PixKeyServiceKafka.name });
  }

  /**
   * Get user by uuid microservice.
   * @param payload The user uuid.
   * @returns User if found or null otherwise.
   */
  async getPixKeyByKey(key: string): Promise<GetByKeyPixKeyServiceResponse> {
    const data: GetByKeyPixKeyKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Get pix Key by key.', { data });

    const pixKey = await this.kafkaService.send<
      GetByKeyPixKeyResponse,
      GetByKeyPixKeyKafkaRequest
    >(KAFKA_TOPICS.KEY.GET_BY_KEY, data);

    this.logger.debug('Found pix key.', { pixKey });

    if (!pixKey) return null;

    const response: GetByKeyPixKeyServiceResponse = {
      id: pixKey.id,
      key: pixKey.key,
      type: pixKey.type,
      state: pixKey.state,
      createdAt: pixKey.createdAt,
    };

    return response;
  }

  /**
   * Send claim portability canceled.
   * @param key The pix key.
   * @returns void.
   */
  async cancelPortabilityClaim(key: string): Promise<void> {
    const data: CancelPortabilityClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send portability canceled to pixKey.', { data });

    await this.kafkaService.send<
      CancelPortabilityClaimProcessResponse,
      CancelPortabilityClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.CANCEL_PORTABILITY_PROCESS, data);
  }

  /**
   * Send claim portability completed.
   * @param key The pix key.
   * @returns void.
   */
  async completePortabilityClaim(key: string): Promise<void> {
    const data: CompletePortabilityClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send portability completed to pixKey.', { data });

    await this.kafkaService.send<
      CompletePortabilityClaimProcessResponse,
      CompletePortabilityClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.COMPLETE_PORTABILITY_PROCESS, data);
  }

  /**
   * Send claim portability confirmed.
   * @param key The pix key.
   * @returns void.
   */
  async confirmPortabilityClaim(key: string): Promise<void> {
    const data: ConfirmPortabilityClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send portability confirmed to pixKey.', { data });

    await this.kafkaService.send<
      ConfirmPortabilityClaimProcessResponse,
      ConfirmPortabilityClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.CONFIRM_PORTABILITY_PROCESS, data);
  }

  /**
   * Send claim ownership waiting.
   * @param key The pix key.
   * @returns void.
   */
  async waitOwnershipClaim(key: string): Promise<void> {
    const data: WaitOwnershipClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send ownership waiting to pixKey.', { data });

    await this.kafkaService.send<
      WaitOwnershipClaimProcessResponse,
      WaitOwnershipClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.WAIT_OWNERSHIP_PROCESS, data);
  }
  /**
   * Send claim ownership completed.
   * @param key The pix key.
   * @returns void.
   */
  async completeOwnershipClaim(key: string): Promise<void> {
    const data: CompleteOwnershipClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send ownership completed to pixKey.', { data });

    await this.kafkaService.send<
      CompleteOwnershipClaimProcessResponse,
      CompleteOwnershipClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.COMPLETE_OWNERSHIP_PROCESS, data);
  }

  /**
   * Send claim ownership canceled.
   * @param key The pix key.
   * @returns void.
   */
  async cancelOwnershipClaim(key: string): Promise<void> {
    const data: CancelOwnershipClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send ownership canceled to pixKey.', { data });

    await this.kafkaService.send<
      CancelOwnershipClaimProcessResponse,
      CancelOwnershipClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.CANCEL_OWNERSHIP_PROCESS, data);
  }

  /**
   * Send claim ownership confirmed.
   * @param key The pix key.
   * @returns void.
   */
  async confirmOwnershipClaim(key: string): Promise<void> {
    const data: ConfirmOwnershipClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send ownership confirmed to pixKey.', { data });

    await this.kafkaService.send<
      ConfirmOwnershipClaimProcessResponse,
      ConfirmOwnershipClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.CONFIRM_OWNERSHIP_PROCESS, data);
  }

  /**
   * Send claim ownership ready.
   * @param key The pix key.
   * @returns void.
   */
  async readyOwnershipClaim(key: string): Promise<void> {
    const data: ReadyOwnershipClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send ownership ready to pixKey.', { data });

    await this.kafkaService.send<
      ReadyOwnershipClaimProcessResponse,
      ReadyOwnershipClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.READY_OWNERSHIP_PROCESS, data);
  }

  /**
   * Send claim portability ready.
   * @param key The pix key.
   * @returns void.
   */
  async readyPortabilityClaim(key: string): Promise<void> {
    const data: ReadyPortabilityClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send portability ready to pixKey.', { data });

    await this.kafkaService.send<
      ReadyPortabilityClaimProcessResponse,
      ReadyPortabilityClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.READY_PORTABILITY_PROCESS, data);
  }

  /**
   * Send claim closing completed.
   * @param key The pix key.
   * @returns void.
   */
  async completeClaimClosing(key: string): Promise<void> {
    const data: CompleteClosingClaimProcessKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: { key },
    };

    this.logger.debug('Send claim closing completed to pixKey.', { data });

    await this.kafkaService.send<
      CompleteClosingClaimProcessResponse,
      CompleteClosingClaimProcessKafkaRequest
    >(KAFKA_TOPICS.KEY.COMPLETE_CLAIM_CLOSING, data);
  }
}
