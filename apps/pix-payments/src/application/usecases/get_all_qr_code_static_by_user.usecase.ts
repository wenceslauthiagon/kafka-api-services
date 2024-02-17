import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { QrCodeStatic, QrCodeStaticRepository } from '@zro/pix-payments/domain';

export class GetAllQrCodeStaticUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   */
  constructor(
    private logger: Logger,
    private readonly qrCodeStaticRepository: QrCodeStaticRepository,
  ) {
    this.logger = logger.child({ context: GetAllQrCodeStaticUseCase.name });
  }

  /**
   * List all QrCodeStatics.
   *
   * @returns QrCodeStatics found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    user: User,
    pagination: Pagination,
  ): Promise<TPaginationResponse<QrCodeStatic>> {
    // Data input check
    if (!user?.uuid || !pagination) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!pagination ? ['Pagination'] : []),
      ]);
    }

    // Search qrCodeStatics
    const result = await this.qrCodeStaticRepository.getAllByUser(
      user,
      pagination,
    );

    this.logger.debug('Found qrCodeStatics.', { result });

    return result;
  }
}
