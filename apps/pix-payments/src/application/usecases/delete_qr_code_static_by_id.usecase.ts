import { Logger } from 'winston';
import { MissingDataException, ForbiddenException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  QrCodeStaticNotFoundException,
  QrCodeStaticEventEmitter,
} from '@zro/pix-payments/application';

export class DeleteByQrCodeStaticIdUseCase {
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
    this.logger = logger.child({ context: DeleteByQrCodeStaticIdUseCase.name });
  }

  /**
   * Delete the qrCodeStatic by id.
   *
   * @param user QrCodeStatic's owner.
   * @param id The qrCodeStatic's id.
   * @returns QrCodeStatic found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {QrCodeStaticNotFoundException} Thrown when qrCodeStatic id was not found.
   * @throws {ForbiddenException} Thrown when userId is not the qrCodeStatic owner.
   */
  async execute(user: User, id: string): Promise<QrCodeStatic> {
    // Data input check
    if (!user || !id) {
      throw new MissingDataException([
        ...(!user ? ['User'] : []),
        ...(!id ? ['ID'] : []),
      ]);
    }

    // Search qrCodeStatic
    const qrCodeStatic = await this.repository.getById(id);

    this.logger.debug('Found qrCodeStatic.', { qrCodeStatic });

    if (!qrCodeStatic) {
      throw new QrCodeStaticNotFoundException({ id });
    }

    if (qrCodeStatic.user.uuid !== user.uuid) {
      throw new ForbiddenException();
    }

    // Only READY qrCodeStatic can go to DELETING state.
    if (qrCodeStatic.state !== QrCodeStaticState.READY) {
      return qrCodeStatic;
    }

    // Update qrCodeStatic
    qrCodeStatic.state = QrCodeStaticState.DELETING;
    await this.repository.update(qrCodeStatic);

    // Fire DeletingQrCodeStaticEvent
    this.eventEmitter.deletingQrCodeStatic(qrCodeStatic);

    this.logger.debug('Deleting qrCodeStatic.', { qrCodeStatic });

    return qrCodeStatic;
  }
}
