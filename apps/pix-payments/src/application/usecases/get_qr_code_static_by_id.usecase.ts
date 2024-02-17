import { Logger } from 'winston';
import { MissingDataException, ForbiddenException } from '@zro/common';
import { User } from '@zro/users/domain';
import { QrCodeStatic, QrCodeStaticRepository } from '@zro/pix-payments/domain';
import { QrCodeStaticNotFoundException } from '../exceptions/qr_code_static_not_found.exception';

export class GetByQrCodeStaticIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   */
  constructor(
    private logger: Logger,
    private readonly qrCodeStaticRepository: QrCodeStaticRepository,
  ) {
    this.logger = logger.child({ context: GetByQrCodeStaticIdUseCase.name });
  }

  /**
   * Get the qrCodeStatic by id.
   *
   * @param user qrCodeStatic's owner.
   * @param id The qrCodeStatic id
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
    const qrCodeStatic = await this.qrCodeStaticRepository.getById(id);

    this.logger.debug('Found qrCodeStatic.', { qrCodeStatic });

    if (!qrCodeStatic) {
      throw new QrCodeStaticNotFoundException({ id });
    }

    if (qrCodeStatic.user.uuid !== user.uuid) {
      throw new ForbiddenException();
    }

    return qrCodeStatic;
  }
}
