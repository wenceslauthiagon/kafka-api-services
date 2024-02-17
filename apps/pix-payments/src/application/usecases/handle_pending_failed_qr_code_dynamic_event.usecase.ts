import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  QrCodeDynamic,
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  QrCodeDynamicNotFoundException,
  QrCodeDynamicEventEmitter,
} from '@zro/pix-payments/application';

export class HandlePendingFailedQrCodeDynamicEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository QrCodeDynamicRepository repository.
   * @param eventEmitter QrCodeDynamic event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: QrCodeDynamicRepository,
    private readonly eventEmitter: QrCodeDynamicEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedQrCodeDynamicEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an error is thrown.
   *
   * @param {String} id QrCodeDynamic id.
   * @returns {QrCodeDynamic} QrCodeDynamic updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {QrCodeDynamicNotFoundException} Thrown when qrCodeDynamic id was not found.
   */
  async execute(id: string): Promise<QrCodeDynamic> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search QrCodeDynamic
    const qrCodeDynamic = await this.repository.getById(id);

    this.logger.debug('Found QrCodeDynamic.', { qrCodeDynamic });

    if (!qrCodeDynamic) {
      throw new QrCodeDynamicNotFoundException({ id });
    }

    // Only PENDING qrCodeDynamic can go to ERROR state.
    if (qrCodeDynamic.state !== PixQrCodeDynamicState.PENDING) {
      return qrCodeDynamic;
    }

    // Update qrCodeDynamic
    qrCodeDynamic.state = PixQrCodeDynamicState.ERROR;
    await this.repository.update(qrCodeDynamic);

    // Fire ErrorQrCodeDynamicEvent
    this.eventEmitter.errorQrCodeDynamic(qrCodeDynamic);

    this.logger.debug('QrCodeDynamic creation error.', { qrCodeDynamic });

    return qrCodeDynamic;
  }
}
