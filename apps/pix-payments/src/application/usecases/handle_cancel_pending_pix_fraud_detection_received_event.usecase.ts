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
  IssuePixFraudDetectionGateway,
  UpdatePixFraudDetectionIssueRequest,
  PixFraudDetectionNotFoundException,
} from '@zro/pix-payments/application';

export class HandleCancelPendingPixFraudDetectionReceivedEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixFraudDetection repository.
   * @param issueGateway IssuePixFraudDetectionGateway gateway.
   * @param eventEmitter PixFraudDetection event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixFraudDetectionRepository,
    private readonly issueGateway: IssuePixFraudDetectionGateway,
    private readonly eventEmitter: PixFraudDetectionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleCancelPendingPixFraudDetectionReceivedEventUseCase.name,
    });
  }

  /**
   * Receive pending canceled pixFraudDetection and cancel on issue gateway.
   *
   * @param pixFraudDetection pixFraudDetection data.
   * @returns FraudDetection updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pixFraudDetection: PixFraudDetection,
  ): Promise<PixFraudDetection> {
    // Data input check
    if (!pixFraudDetection?.externalId) {
      throw new MissingDataException(['External ID']);
    }

    const foundPixFraudDetection = await this.repository.getByExternalId(
      pixFraudDetection.externalId,
    );

    this.logger.debug('Found pix fraud detection.', {
      pixFraudDetection: foundPixFraudDetection,
    });

    if (!foundPixFraudDetection) {
      throw new PixFraudDetectionNotFoundException(pixFraudDetection);
    }

    if (
      ![
        PixFraudDetectionState.CANCELED_RECEIVED_PENDING,
        PixFraudDetectionState.FAILED,
      ].includes(foundPixFraudDetection.state)
    ) {
      throw new PixFraudDetectionInvalidStateException(foundPixFraudDetection);
    }

    const request: UpdatePixFraudDetectionIssueRequest = {
      issueId: foundPixFraudDetection.issueId,
      status: PixFraudDetectionStatus.CANCELED_RECEIVED,
    };

    this.logger.debug(
      'Cancel pix fraud detection issue on issueGateway request.',
      { request },
    );

    await this.issueGateway.updatePixFraudDetectionIssue(request);

    this.logger.debug(
      'Pix fraud detection issue on issueGateway has been canceled.',
    );

    foundPixFraudDetection.state =
      PixFraudDetectionState.CANCELED_RECEIVED_CONFIRMED;

    // Update pixFraudDetection
    await this.repository.update(foundPixFraudDetection);

    this.logger.debug('Updated pix fraud detection.', {
      foundPixFraudDetection,
    });

    // Fire ReceiveConfirmedFraudDetectionEvent
    this.eventEmitter.cancelConfirmedPixFraudDetectionReceived(
      foundPixFraudDetection,
    );

    return foundPixFraudDetection;
  }
}
