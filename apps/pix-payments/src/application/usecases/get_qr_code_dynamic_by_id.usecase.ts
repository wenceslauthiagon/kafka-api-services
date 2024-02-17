import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  QrCodeDynamic,
  QrCodeDynamicRepository,
} from '@zro/pix-payments/domain';
import { QrCodeDynamicNotFoundException } from '@zro/pix-payments/application';

export class GetQrCodeDynamicByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   */
  constructor(
    private logger: Logger,
    private readonly qrCodeDynamicRepository: QrCodeDynamicRepository,
  ) {
    this.logger = logger.child({ context: GetQrCodeDynamicByIdUseCase.name });
  }

  /**
   * Get the qrCodeDynamic by id.
   *
   * @param user qrCodeDynamic's owner.
   * @param id The qrCodeDynamic id
   * @returns QrCodeDynamic found.
   * @throws {QrCodeDynamicNotFoundException} Thrown when qrCodeDynamic id was not found.
   */
  async execute(id: string, user?: User): Promise<QrCodeDynamic> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search qrCodeDynamic
    const qrCodeDynamic = await this.qrCodeDynamicRepository.getById(id);

    this.logger.debug('Found qrCodeDynamic.', { qrCodeDynamic });

    if (!qrCodeDynamic || (user && user.uuid !== qrCodeDynamic.user.uuid)) {
      throw new QrCodeDynamicNotFoundException({ id });
    }

    return qrCodeDynamic;
  }
}
