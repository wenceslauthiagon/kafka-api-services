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
  PixFraudDetectionNotFoundException,
} from '@zro/pix-payments/application';

export class CancelPixFraudDetectionRegisteredUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixFraudDetection repository.
   * @param fraudDetectionEventEmitter PixFraudDetection event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixFraudDetectionRepository,
    private readonly fraudDetectionEventEmitter: PixFraudDetectionEventEmitter,
  ) {
    this.logger = logger.child({
      context: CancelPixFraudDetectionRegisteredUseCase.name,
    });
  }

  /**
   * Cancel an pix fraud detection that was registered by the IssueGateway.
   *
   * @param issueId Pix fraud detection IssueID.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(issueId: number): Promise<PixFraudDetection> {
    // Data input check
    if (!issueId) {
      throw new MissingDataException(['Issue ID']);
    }

    // Check if ID is available.
    const pixFraudDetection = await this.repository.getByIssueId(issueId);

    this.logger.debug('Found pix fraud detection.', {
      pixFraudDetection,
    });

    if (!pixFraudDetection) {
      throw new PixFraudDetectionNotFoundException({ issueId });
    }

    // Only registered pix fraud detections can be manually canceled.
    if (
      pixFraudDetection.status === PixFraudDetectionStatus.CANCELED_RECEIVED ||
      pixFraudDetection.status === PixFraudDetectionStatus.RECEIVED
    ) {
      return;
    }

    // Idempotence check.
    if (
      pixFraudDetection.state ===
        PixFraudDetectionState.CANCELED_REGISTERED_PENDING ||
      pixFraudDetection.state ===
        PixFraudDetectionState.CANCELED_REGISTERED_CONFIRMED
    ) {
      return pixFraudDetection;
    }

    pixFraudDetection.status = PixFraudDetectionStatus.CANCELED_REGISTERED;
    pixFraudDetection.state =
      PixFraudDetectionState.CANCELED_REGISTERED_PENDING;

    await this.repository.update(pixFraudDetection);

    // Fire register pending event.
    this.fraudDetectionEventEmitter.cancelPendingPixFraudDetectionRegistered(
      pixFraudDetection,
    );

    return pixFraudDetection;
  }
}
