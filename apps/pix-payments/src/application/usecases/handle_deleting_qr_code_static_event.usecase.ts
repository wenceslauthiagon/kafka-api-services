import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  QrCodeStatic,
  QrCodeStaticState,
  QrCodeStaticRepository,
} from '@zro/pix-payments/domain';
import {
  QrCodeStaticEventEmitter,
  DeleteQrCodeStaticPixPaymentPspRequest,
  PixPaymentGateway,
} from '@zro/pix-payments/application';

export class HandleDeletingQrCodeStaticEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository QrCodeStatic repository.
   * @param pspGateway PSP gateway instance.
   * @param eventEmitter QrCodeStatic event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: QrCodeStaticRepository,
    private readonly pspGateway: PixPaymentGateway,
    private readonly eventEmitter: QrCodeStaticEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleDeletingQrCodeStaticEventUseCase.name,
    });
  }

  /**
   * Delete the qrCodeStatic by id.
   *
   * @param {UUID} id The qrCodeStatic id
   * @returns {QrCodeStatic} QrCodeStatic deleted.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<QrCodeStatic> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search qrCodeStatic
    const qrCodeStatic = await this.repository.getById(id);

    this.logger.debug('Found qrCodeStatic.', { qrCodeStatic });

    // Only DELETING qrCodeStatics can be deleted.
    if (!qrCodeStatic || qrCodeStatic.state !== QrCodeStaticState.DELETING) {
      return qrCodeStatic;
    }

    const body: DeleteQrCodeStaticPixPaymentPspRequest = {
      txId: qrCodeStatic.txId,
    };

    await this.pspGateway.deleteQrCodeStatic(body);

    this.logger.debug('QrCodeStatic deleted on PSP gateway.');

    // Update qrCodeStatic
    qrCodeStatic.state = QrCodeStaticState.DELETED;
    await this.repository.update(qrCodeStatic);
    await this.repository.deleteById(id);

    // Fire DeletedQrCodeStaticEvent
    this.eventEmitter.deletedQrCodeStatic(qrCodeStatic);

    this.logger.debug('QrCodeStatic deleted.', { qrCodeStatic });

    return qrCodeStatic;
  }
}
