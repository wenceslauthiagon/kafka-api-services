import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  QrCodeStatic,
  QrCodeStaticState,
  QrCodeStaticRepository,
} from '@zro/pix-payments/domain';
import { QrCodeStaticEventEmitter } from '../events/qr_code_static.emitter';

export class HandleDeletingFailedQrCodeStaticEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository QrCodeStatic repository.
   * @param eventEmitter QrCodeStatic event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: QrCodeStaticRepository,
    private readonly eventEmitter: QrCodeStaticEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleDeletingFailedQrCodeStaticEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an error is thrown.
   *
   * @param {String} id QrCodeStatic id.
   * @returns {QrCodeStatic} QrCodeStatic updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<QrCodeStatic> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search QrCodeStatic
    const qrCodeStatic = await this.repository.getById(id);

    this.logger.debug('Found qrCodeStatic.', { qrCodeStatic });

    // Only DELETING qrCodeStatics can go to ERROR state.
    if (!qrCodeStatic || qrCodeStatic.state !== QrCodeStaticState.DELETING) {
      return qrCodeStatic;
    }

    // Update qrCodeStatic
    qrCodeStatic.state = QrCodeStaticState.ERROR;
    await this.repository.update(qrCodeStatic);

    // Fire ErrorQrCodeStaticEvent
    this.eventEmitter.errorQrCodeStatic(qrCodeStatic);

    this.logger.debug('Added error qrCodeStatic.', { qrCodeStatic });

    return qrCodeStatic;
  }
}
