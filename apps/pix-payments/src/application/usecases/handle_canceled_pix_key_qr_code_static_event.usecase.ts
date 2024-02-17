import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey } from '@zro/pix-keys/domain';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import { QrCodeStaticEventEmitter } from '../events/qr_code_static.emitter';

export class HandleCanceledPixKeyQrCodeStaticEventUseCase {
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
      context: HandleCanceledPixKeyQrCodeStaticEventUseCase.name,
    });
  }

  /**
   * Delete the qrCodeStatic by pixKey id when the canceled pixKey event is triggered.
   *
   * @param {User} user QrCodeStatic's owner.
   * @param {PixKey} pixKey The qrCodeStatic's pixKey.
   * @returns {QrCodeStatic[]} QrCodeStatics found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(user: User, pixKey: PixKey): Promise<QrCodeStatic[]> {
    // Data input check
    if (!user || !pixKey) {
      throw new MissingDataException([
        ...(!user ? ['User'] : []),
        ...(!pixKey ? ['PixKey'] : []),
      ]);
    }

    // Search qrCodeStatics
    const qrCodeStatics = await this.repository.getByPixKey(pixKey);

    this.logger.debug('Found qrCodeStatics.', { qrCodeStatics });

    const updatedQrCodeStatics = await Promise.all(
      qrCodeStatics.map(async (qrCodeStatic) => {
        // Check idempotency
        if (qrCodeStatic.state === QrCodeStaticState.DELETING) {
          return null;
        }

        // Update qrCodeStatic
        qrCodeStatic.state = QrCodeStaticState.DELETING;
        await this.repository.update(qrCodeStatic);

        this.logger.debug('Deleting qrCodeStatic.', { qrCodeStatic });

        // Fire DeletingQrCodeStaticEvent
        this.eventEmitter.deletingQrCodeStatic(qrCodeStatic);

        return qrCodeStatic;
      }),
    );

    return updatedQrCodeStatics.filter((item) => item);
  }
}
