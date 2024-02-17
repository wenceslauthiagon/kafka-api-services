import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import {
  PixFraudDetectionEventEmitter,
  PixFraudDetectionInvalidStateException,
  PixFraudDetectionGateway,
  CancelFraudDetectionPixFraudDetectionPspRequest,
  PixFraudDetectionNotFoundException,
} from '@zro/pix-payments/application';

export class HandleCancelPendingPixFraudDetectionRegisteredEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixFraudDetection repository.
   * @param pspGateway PixFraudDetectionGateway gateway.
   * @param eventEmitter PixFraudDetection event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixFraudDetectionRepository,
    private readonly pspGateway: PixFraudDetectionGateway,
    private readonly eventEmitter: PixFraudDetectionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleCancelPendingPixFraudDetectionRegisteredEventUseCase.name,
    });
  }

  /**
   * Cancel pending registered and cancel pixFraudDetection on gateway.
   *
   * @param id.
   * @returns {PixFraudDetection} FraudDetection updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<PixFraudDetection> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    const pixFraudDetection = await this.repository.getById(id);

    this.logger.debug('Found pix fraud detection', { pixFraudDetection });

    if (!pixFraudDetection) {
      throw new PixFraudDetectionNotFoundException(pixFraudDetection);
    }

    // Idempotence check.
    if (
      pixFraudDetection.state ===
      PixFraudDetectionState.CANCELED_REGISTERED_CONFIRMED
    ) {
      return pixFraudDetection;
    }

    if (
      ![
        PixFraudDetectionState.CANCELED_REGISTERED_PENDING,
        PixFraudDetectionState.FAILED,
      ].includes(pixFraudDetection.state)
    ) {
      throw new PixFraudDetectionInvalidStateException(pixFraudDetection);
    }

    const request: CancelFraudDetectionPixFraudDetectionPspRequest = {
      fraudDetectionId: pixFraudDetection.externalId,
    };

    this.logger.debug('Cancel pix fraud detection on pspGateway request.', {
      request,
    });

    const pspResult = await this.pspGateway.cancelFraudDetection(request);

    this.logger.debug('Cancel pix fraud detection on pspGateway response.', {
      pspResult,
    });

    pixFraudDetection.state =
      PixFraudDetectionState.CANCELED_REGISTERED_CONFIRMED;

    // Update pixFraudDetection
    await this.repository.update(pixFraudDetection);

    this.logger.debug('Updated pix fraud detection.', {
      pixFraudDetection,
    });

    // Fire CancelConfirmedPixFraudDetectionRegisteredEvent
    this.eventEmitter.cancelConfirmedPixFraudDetectionRegistered(
      pixFraudDetection,
    );

    return pixFraudDetection;
  }
}
