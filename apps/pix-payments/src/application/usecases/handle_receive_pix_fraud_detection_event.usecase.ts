import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { MissingDataException, isCpf } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import {
  PixFraudDetectionEventEmitter,
  PixFraudDetectionInvalidStatusException,
} from '@zro/pix-payments/application';
import { PersonType } from '@zro/users/domain';

export class HandleReceivePixFraudDetectionEventUseCase {
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
      context: HandleReceivePixFraudDetectionEventUseCase.name,
    });
  }

  /**
   * Receive an pix fraud detection that was created by the PSPGateway.
   *
   * @param id Pix fraud detection id.
   * @param externalId Pix fraud detection externalId.
   * @param document Pix fraud detection document.
   * @param fraudType Pix fraud detection fraudType.
   * @param status Pix fraud detection status.
   * @param key Pix fraud detection key.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    externalId: string,
    document: string,
    fraudType: PixFraudDetectionType,
    status: PixFraudDetectionStatus,
    key?: string,
  ): Promise<void> {
    // Data input check
    if (!externalId || !document || !fraudType || !status) {
      throw new MissingDataException([
        ...(!externalId ? ['External ID'] : []),
        ...(!document ? ['Document'] : []),
        ...(!fraudType ? ['Fraud Type'] : []),
        ...(!status ? ['Status'] : []),
      ]);
    }

    // Check if ID is available.
    const pixFraudDetection = await this.repository.getByExternalId(externalId);

    this.logger.debug('Found pix fraud detection.', {
      pixFraudDetection,
    });

    if (pixFraudDetection) return;

    // Validate status.
    if (status !== PixFraudDetectionStatus.REGISTERED) {
      throw new PixFraudDetectionInvalidStatusException({ status });
    }

    const newFraudDetection = new PixFraudDetectionEntity({
      id: uuidV4(),
      externalId,
      personType: isCpf(document)
        ? PersonType.NATURAL_PERSON
        : PersonType.LEGAL_PERSON,
      document,
      fraudType,
      key,
      status: PixFraudDetectionStatus.RECEIVED,
      state: PixFraudDetectionState.RECEIVED_PENDING,
    });

    await this.repository.create(newFraudDetection);
    this.logger.debug('Created a pix fraud detection.', {
      pixFraudDetection: newFraudDetection,
    });

    // Fire received pending event.
    this.eventEmitter.receivedPendingPixFraudDetection(newFraudDetection);
  }
}
