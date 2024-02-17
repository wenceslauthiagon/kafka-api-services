import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Address, AddressRepository, User } from '@zro/users/domain';
import { AddressNotFoundException } from '@zro/users/application';

export class GetAddressByIdUseCase {
  constructor(
    private logger: Logger,
    private readonly addressRepository: AddressRepository,
  ) {
    this.logger = logger.child({ context: GetAddressByIdUseCase.name });
  }

  /**
   * Get user's address by id.
   *
   * @param id Address id.
   * @returns The address found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: number, user: User): Promise<Address> {
    if (!id || !user?.uuid) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User'] : []),
      ]);
    }

    // Search address
    const result = await this.addressRepository.getById(id);

    this.logger.debug('Address found.', { result });

    if (!result) {
      throw new AddressNotFoundException({ id });
    }

    return result;
  }
}
