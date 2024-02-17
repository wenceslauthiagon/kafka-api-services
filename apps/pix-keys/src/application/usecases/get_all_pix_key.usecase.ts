import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey, PixKeyRepository } from '@zro/pix-keys/domain';

export class GetAllPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({ context: GetAllPixKeyUseCase.name });
  }

  /**
   * List all keys.
   *
   * @param {Pagination} pagination The pagination filter.
   * @param {[User]} user Keys' owner.
   * @returns {PixKey[]} Keys found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    user?: User,
  ): Promise<TPaginationResponse<PixKey>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search pixKeys
    const result = await this.pixKeyRepository.getByUserAndStateIsNotCanceled(
      pagination,
      user,
    );

    this.logger.debug('Found pix keys.', { result });

    return result;
  }
}
