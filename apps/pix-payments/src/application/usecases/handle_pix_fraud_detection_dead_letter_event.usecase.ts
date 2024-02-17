import { Logger } from 'winston';
import { Failed, MissingDataException } from '@zro/common';
import {
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import { PixFraudDetectionNotFoundException } from '@zro/pix-payments/application';

export class HandlePixFraudDetectionDeadLetterEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixFraudDetection repository.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixFraudDetectionRepository,
  ) {
    this.logger = logger.child({
      context: HandlePixFraudDetectionDeadLetterEventUseCase.name,
    });
  }

  /**
   * Handler triggered when a pix fraud detection dead letter event is received.
   *
   * @param id PixFraudDetection id.
   * @param failed PixFraudDetection failed.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string, failed?: Failed): Promise<void> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search Pix Fraud Detection.
    const pixFraudDetection = await this.repository.getById(id);

    this.logger.debug('Found pix fraud detection.', { pixFraudDetection });

    if (!pixFraudDetection) {
      throw new PixFraudDetectionNotFoundException({ id });
    }

    // Check idempotence.
    if (pixFraudDetection.state === PixFraudDetectionState.FAILED) {
      return;
    }

    // Update pix fraud detection.
    pixFraudDetection.failed = failed;
    pixFraudDetection.state = PixFraudDetectionState.FAILED;

    await this.repository.update(pixFraudDetection);
    this.logger.debug('Updated pix fraud detection.', { pixFraudDetection });
  }
}
