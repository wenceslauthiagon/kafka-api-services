import { Logger } from 'winston';
import { MissingDataException, isCpf } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { PixFraudDetectionEventEmitter } from '@zro/pix-payments/application';
import { PersonType } from '@zro/users/domain';

export class RegisterPixFraudDetectionUseCase {
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
      context: RegisterPixFraudDetectionUseCase.name,
    });
  }

  /**
   * Register an pix fraud detection that was created by the IssueGateway.
   * @param id Pix fraud detection ID.
   * @param issueId Pix fraud detection IssueID.
   * @param document Pix fraud detection document.
   * @param fraudType Pix fraud detection fraudType.
   * @param key Pix fraud detection key.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    issueId: number,
    document: string,
    fraudType: PixFraudDetectionType,
    key?: string,
  ): Promise<PixFraudDetection> {
    // Data input check
    if (!id || !issueId || !document || !fraudType) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!document ? ['Document'] : []),
        ...(!fraudType ? ['Fraud Type'] : []),
        ...(!issueId ? ['Issue ID'] : []),
      ]);
    }

    // Check if ID is available.
    const pixFraudDetection = await this.repository.getByIssueId(issueId);

    this.logger.debug('Check if pix fraud detection exists.', {
      pixFraudDetection,
    });

    if (pixFraudDetection) return pixFraudDetection;

    const newFraudDetection = new PixFraudDetectionEntity({
      id,
      issueId,
      personType: isCpf(document)
        ? PersonType.NATURAL_PERSON
        : PersonType.LEGAL_PERSON,
      document,
      fraudType,
      key,
      status: PixFraudDetectionStatus.REGISTERED,
      state: PixFraudDetectionState.REGISTERED_PENDING,
    });

    await this.repository.create(newFraudDetection);

    this.logger.debug('Created a pix fraud detection.', {
      pixFraudDetection: newFraudDetection,
    });

    // Fire register pending event.
    this.fraudDetectionEventEmitter.registerPendingPixFraudDetection(
      newFraudDetection,
    );

    return newFraudDetection;
  }
}
