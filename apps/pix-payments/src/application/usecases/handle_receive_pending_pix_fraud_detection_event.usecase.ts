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
  IssuePixFraudDetectionGateway,
  CreatePixFraudDetectionIssueRequest,
  PixFraudDetectionNotFoundException,
} from '@zro/pix-payments/application';

export class HandleReceivePendingPixFraudDetectionEventUseCase {
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
      context: HandleReceivePendingPixFraudDetectionEventUseCase.name,
    });
  }

  /**
   * Receive pending pixFraudDetection and create on issue gateway.
   *
   * @param pixFraudDetection PixFraudDetection.
   * @returns {PixFraudDetection} FraudDetection updated.
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
        PixFraudDetectionState.RECEIVED_PENDING,
        PixFraudDetectionState.FAILED,
      ].includes(foundPixFraudDetection.state)
    ) {
      throw new PixFraudDetectionInvalidStateException(foundPixFraudDetection);
    }

    const request: CreatePixFraudDetectionIssueRequest = {
      externalId: foundPixFraudDetection.externalId,
      document: foundPixFraudDetection.document,
      fraudType: foundPixFraudDetection.fraudType,
      key: foundPixFraudDetection.key,
    };

    this.logger.debug(
      'Create pix fraud detection issue on issueGateway request.',
      {
        request,
      },
    );

    const { issueId } =
      await this.issueGateway.createPixFraudDetectionIssue(request);

    this.logger.debug(
      'Create pix fraud detection issue on issueGateway response.',
      {
        issueId,
      },
    );

    foundPixFraudDetection.issueId = issueId;
    foundPixFraudDetection.state = PixFraudDetectionState.RECEIVED_CONFIRMED;

    // Update pixFraudDetection
    await this.repository.update(foundPixFraudDetection);

    this.logger.debug('Updated pix fraud detection.', {
      pixFraudDetection: foundPixFraudDetection,
    });

    // Fire ReceiveConfirmedFraudDetectionEvent
    this.eventEmitter.receivedConfirmedPixFraudDetection(
      foundPixFraudDetection,
    );

    return foundPixFraudDetection;
  }
}
