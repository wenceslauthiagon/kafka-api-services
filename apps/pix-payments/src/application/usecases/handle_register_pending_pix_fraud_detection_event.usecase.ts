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
  CreateFraudDetectionPixFraudDetectionPspRequest,
  PixFraudDetectionNotFoundException,
  IssuePixFraudDetectionGateway,
  UpdatePixFraudDetectionIssueRequest,
} from '@zro/pix-payments/application';

export class HandleRegisterPendingPixFraudDetectionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixFraudDetection repository.
   * @param pspGateway PixFraudDetectionGateway gateway.
   * @param issuePixFraudDetectionGateway IssuePixFraudDetection gateway.
   * @param eventEmitter PixFraudDetection event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixFraudDetectionRepository,
    private readonly pspGateway: PixFraudDetectionGateway,
    private readonly issuePixFraudDetectionGateway: IssuePixFraudDetectionGateway,
    private readonly eventEmitter: PixFraudDetectionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleRegisterPendingPixFraudDetectionEventUseCase.name,
    });
  }

  /**
   * Register pending pixFraudDetection and create pixFraudDetection on gateway.
   *
   * @param id pixFraudDetection ID.
   * @returns {PixFraudDetection} pixFraudDetection updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<PixFraudDetection> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['Pix Fraud Detection ID']);
    }

    const pixFraudDetection = await this.repository.getById(id);

    this.logger.debug('Found pix fraud detection', { pixFraudDetection });

    if (!pixFraudDetection) {
      throw new PixFraudDetectionNotFoundException({ id });
    }

    // Idempotence check.
    if (
      pixFraudDetection.state === PixFraudDetectionState.REGISTERED_CONFIRMED
    ) {
      return pixFraudDetection;
    }

    if (
      ![
        PixFraudDetectionState.REGISTERED_PENDING,
        PixFraudDetectionState.FAILED,
      ].includes(pixFraudDetection.state)
    ) {
      throw new PixFraudDetectionInvalidStateException(pixFraudDetection);
    }

    const request: CreateFraudDetectionPixFraudDetectionPspRequest = {
      personType: pixFraudDetection.personType,
      document: pixFraudDetection.document,
      fraudType: pixFraudDetection.fraudType,
      key: pixFraudDetection.key,
    };

    this.logger.debug('Create pix fraud detection on pspGateway request.', {
      request,
    });

    const pspResult = await this.pspGateway.createFraudDetection(request);

    this.logger.debug('Create pix fraud detection on pspGateway response.', {
      pspResult,
    });

    pixFraudDetection.externalId = pspResult.fraudDetectionId;
    pixFraudDetection.state = PixFraudDetectionState.REGISTERED_CONFIRMED;

    // Update issue card
    const updateIssue: UpdatePixFraudDetectionIssueRequest = {
      issueId: pixFraudDetection.issueId,
      externalId: pixFraudDetection.externalId,
    };

    await this.issuePixFraudDetectionGateway.updatePixFraudDetectionIssue(
      updateIssue,
    );

    // Update pixFraudDetection
    await this.repository.update(pixFraudDetection);

    this.logger.debug('Updated pix fraud detection.', {
      pixFraudDetection,
    });

    // Fire RegisterConfirmedPixFraudDetectionEvent
    this.eventEmitter.registerConfirmedPixFraudDetection(pixFraudDetection);

    return pixFraudDetection;
  }
}
