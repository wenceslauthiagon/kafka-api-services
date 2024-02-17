import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';

export class GetUserByDocumentUseCase {
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserByDocumentUseCase.name });
  }

  /**
   * Get user by document.
   *
   * @param document User document.
   * @returns The user found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(document: string): Promise<User> {
    // Data input check
    if (!document) {
      throw new MissingDataException(['Document']);
    }

    // Search user
    const user = await this.userRepository.getByDocument(document);

    this.logger.debug('User found.', { user });

    return user;
  }
}
