import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey, PixKeyRepository } from '@zro/pix-keys/domain';

export class GetAllPixKeyByUserUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({ context: GetAllPixKeyByUserUseCase.name });
  }

  /**
   * List all keys by user.
   *
   * @param pagination The pagination filter.
   * @param user Keys' owner.
   * @returns Keys found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    user: User,
  ): Promise<TPaginationResponse<PixKey>> {
    // Data input check
    if (!pagination || !user?.uuid) {
      throw new MissingDataException([
        ...(!pagination ? ['Pagination'] : []),
        ...(!user ? ['User ID'] : []),
      ]);
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
