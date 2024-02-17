import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  QrCodeStaticNotFoundException,
  QrCodeStaticEventEmitter,
} from '@zro/pix-payments/application';

export class HandlePendingFailedQrCodeStaticEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository QrCodeStaticRepository repository.
   * @param eventEmitter QrCodeStatic event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: QrCodeStaticRepository,
    private readonly eventEmitter: QrCodeStaticEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedQrCodeStaticEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an error is thrown.
   *
   * @param {String} id QrCodeStatic id.
   * @returns {QrCodeStatic} QrCodeStatic updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {QrCodeStaticNotFoundException} Thrown when qrCodeStatic id was not found.
   */
  async execute(id: string): Promise<QrCodeStatic> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search QrCodeStatic
    const qrCodeStatic = await this.repository.getById(id);

    this.logger.debug('Found QrCodeStatic.', { qrCodeStatic });

    if (!qrCodeStatic) {
      throw new QrCodeStaticNotFoundException({ id });
    }

    // Only PENDING qrCodeStatic can go to ERROR state.
    if (qrCodeStatic.state !== QrCodeStaticState.PENDING) {
      return qrCodeStatic;
    }

    // Update qrCodeStatic
    qrCodeStatic.state = QrCodeStaticState.ERROR;
    await this.repository.update(qrCodeStatic);

    // Fire ErrorQrCodeStaticEvent
    this.eventEmitter.errorQrCodeStatic(qrCodeStatic);

    this.logger.debug('QrCodeStatic creation error.', { qrCodeStatic });

    return qrCodeStatic;
  }
}
