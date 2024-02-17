import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  GetInfractionPixInfractionPspRequest,
  GetInfractionPixInfractionPspResponse,
  PixInfractionEvent,
  PixInfractionEventEmitter,
  PixInfractionGateway,
} from '@zro/pix-payments/application';
import {
  PixInfractionStatus,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';

export class SyncPixInfractionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixInfractionRepository PixInfraction repository.
   * @param pspGateway PSP gateway instance.
   * @param eventEmitter Pix infraction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly pixInfractionRepository: PixInfractionRepository,
    private readonly pspGateway: PixInfractionGateway,
    private readonly eventEmitter: PixInfractionEventEmitter,
  ) {
    this.logger = logger.child({ context: SyncPixInfractionUseCase.name });
  }

  /**
   * Sync Infractions.
   */
  async execute(): Promise<void> {
    this.logger.debug('Sync pix infractions from the PSP.');

    const request: GetInfractionPixInfractionPspRequest = {
      startCreationDate: new Date(),
      endCreationDate: new Date(),
    };

    this.logger.debug('Get pix infractions from PSP gateway request.', {
      request,
    });

    const infractions = await this.pspGateway.getInfractions(request);

    this.logger.debug('Get pix infractions from PSP gateway response.', {
      length: infractions.length,
    });

    for (const infraction of infractions) {
      switch (infraction.status) {
        case PixInfractionStatus.ACKNOWLEDGED:
          const infractionFound = await this.pixInfractionRepository.getById(
            infraction.infractionId,
          );

          this.logger.debug('Found pix infraction.', {
            pixInfraction: infractionFound,
          });

          if (!infractionFound) {
            this.handleReceiveInfraction(infraction);
          } else {
            this.handleAcknowledgeInfraction(infraction);
          }

          break;
        case PixInfractionStatus.CANCELLED:
          this.handleCanceledInfraction(infraction);
          break;

        case PixInfractionStatus.CLOSED:
          this.handleClosedInfraction(infraction);
          break;

        default:
          this.logger.error('Invalid infraction status.', {
            infraction,
          });
      }
    }

    this.logger.debug('Finished Sync pix infractions from PSP.');
  }

  private handleAcknowledgeInfraction(
    infraction: GetInfractionPixInfractionPspResponse,
  ): void {
    const payload: PixInfractionEvent = {
      infractionPspId: infraction.infractionId,
    };

    // Emit event.
    this.eventEmitter.acknowledgePixInfraction(payload);

    this.logger.debug('Acknowledge pix infraction.', { infraction: payload });
  }

  private handleReceiveInfraction(
    infraction: GetInfractionPixInfractionPspResponse,
  ): void {
    const payload: PixInfractionEvent = {
      id: uuidV4(),
      infractionPspId: infraction.infractionId,
      infractionType: infraction.infractionType,
      status: infraction.status,
      ispbDebitedParticipant: infraction.debitedParticipant,
      ispbCreditedParticipant: infraction.creditedParticipant,
      reportBy: infraction.reportedBy,
      ispb: infraction.ispb,
      endToEndId: infraction.endToEndId,
      creationDate: infraction.creationDate,
      lastChangeDate: infraction.lastChangeDate,
      isReporter: infraction.isReporter,
      operationTransactionId: infraction.operationTransactionId,
      reportDetails: infraction.reportDetails,
    };

    // Emit event.
    this.eventEmitter.receivePixInfraction(payload);

    this.logger.debug('Receive pix infraction.', { infraction: payload });
  }

  private handleCanceledInfraction(
    infraction: GetInfractionPixInfractionPspResponse,
  ): void {
    const payload: PixInfractionEvent = {
      infractionPspId: infraction.infractionId,
      analysisDetails: infraction.analysisDetails,
      analysisResult: infraction.analysisResult,
    };

    // Emit event.
    this.eventEmitter.cancelPixInfractionReceived(payload);

    this.logger.debug('Cancel pix infraction.', { infraction: payload });
  }

  private handleClosedInfraction(
    infraction: GetInfractionPixInfractionPspResponse,
  ): void {
    const payload: PixInfractionEvent = {
      infractionPspId: infraction.infractionId,
      analysisDetails: infraction.analysisDetails,
      analysisResult: infraction.analysisResult,
    };

    // Emit event.
    this.eventEmitter.closePixInfractionReceived(payload);

    this.logger.debug('Close pix infraction.', { infraction: payload });
  }
}
