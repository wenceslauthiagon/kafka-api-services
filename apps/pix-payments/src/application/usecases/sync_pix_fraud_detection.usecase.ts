import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import {
  GetAllFraudDetectionPixFraudDetectionPspRequest,
  PixFraudDetectionEventEmitter,
  PixFraudDetectionGateway,
} from '@zro/pix-payments/application';

export class SyncPixFraudDetectionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param eventEmitter PixFraudDetection event emitter.
   * @param pspGateway PSP gateway instance.
   */
  constructor(
    private logger: Logger,
    private readonly eventEmitter: PixFraudDetectionEventEmitter,
    private readonly pspGateway: PixFraudDetectionGateway,
  ) {
    this.logger = logger.child({ context: SyncPixFraudDetectionUseCase.name });
  }

  /**
   * Sync PixFraudDetection.
   */
  async execute(): Promise<void> {
    this.logger.debug('Sync pix fraud detections from PSP');

    const request: GetAllFraudDetectionPixFraudDetectionPspRequest = {
      createdAtStart: getMoment().toDate(),
      createdAtEnd: getMoment().toDate(),
    };

    this.logger.debug('Get pix fraud detections from PSP gateway request.', {
      request,
    });

    const response = await this.pspGateway.getAllFraudDetection(request);

    this.logger.debug('Get pix pixFraudDetections from PSP gateway response.', {
      response,
    });

    if (!response?.fraudDetections?.length) return;

    for (const fraudDetection of response.fraudDetections) {
      const newPixFraudDetection = new PixFraudDetectionEntity({
        externalId: fraudDetection.fraudDetectionId,
        document: fraudDetection.document,
        fraudType: fraudDetection.fraudType,
        status: fraudDetection.status,
        key: fraudDetection.key,
      });

      switch (newPixFraudDetection.status) {
        case PixFraudDetectionStatus.REGISTERED:
          this.eventEmitter.receivedPixFraudDetection(newPixFraudDetection);
          break;
        case PixFraudDetectionStatus.CANCELED_REGISTERED:
          this.eventEmitter.cancelPixFraudDetectionReceived(
            newPixFraudDetection,
          );
          break;
        default:
          this.logger.error('Invalid fraud detection status.', {
            fraudDetection,
          });
      }
    }

    this.logger.debug('Finished Sync pix fraud detections from PSP.');
  }
}
