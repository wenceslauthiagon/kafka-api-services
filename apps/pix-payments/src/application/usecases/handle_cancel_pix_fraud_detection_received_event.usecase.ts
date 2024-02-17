import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import {
  PixFraudDetectionEventEmitter,
  PixFraudDetectionInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleCancelPixFraudDetectionReceivedEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixFraudDetection repository.
   * @param eventEmitter PixFraudDetection event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixFraudDetectionRepository,
    private readonly eventEmitter: PixFraudDetectionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleCancelPixFraudDetectionReceivedEventUseCase.name,
    });
  }

  /**
   * Receive an pix fraud detection that was created by the PSPGateway.
   *
   * @param pixFraudDetection Pix fraud detection.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(pixFraudDetection: PixFraudDetection): Promise<void> {
    // Data input check
    if (!pixFraudDetection?.externalId || !pixFraudDetection?.status) {
      throw new MissingDataException([
        ...(!pixFraudDetection?.externalId ? ['External ID'] : []),
        ...(!pixFraudDetection?.status ? ['Status'] : []),
      ]);
    }

    // Check if pixFraudDetection exists.
    const foundPixFraudDetection = await this.repository.getByExternalId(
      pixFraudDetection.externalId,
    );

    this.logger.debug('Found pix fraud detection.', {
      pixFraudDetection: foundPixFraudDetection,
    });

    if (!foundPixFraudDetection) {
      return;
    }

    // Idempotence check.
    if (
      foundPixFraudDetection.status ===
      PixFraudDetectionStatus.CANCELED_RECEIVED
    ) {
      throw new PixFraudDetectionInvalidStateException({
        status: foundPixFraudDetection.status,
      });
    }

    foundPixFraudDetection.status = PixFraudDetectionStatus.CANCELED_RECEIVED;
    foundPixFraudDetection.state =
      PixFraudDetectionState.CANCELED_RECEIVED_PENDING;

    await this.repository.update(foundPixFraudDetection);
    this.logger.debug('Updated pix fraud detection.', {
      pixFraudDetection: foundPixFraudDetection,
    });

    // Fire cancel received pending event.
    this.eventEmitter.cancelPendingPixFraudDetectionReceived(
      foundPixFraudDetection,
    );
  }
}
