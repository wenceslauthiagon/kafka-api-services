import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Admin, AdminRepository } from '@zro/admin/domain';

export class GetAdminByEmailUseCase {
  constructor(
    private logger: Logger,
    private adminRepository: AdminRepository,
  ) {
    this.logger = logger.child({ context: GetAdminByEmailUseCase.name });
  }

  /**
   * Get admin by email.
   *
   * @param email Admin phone number.
   * @returns The admin found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(email: string): Promise<Admin> {
    if (!email) {
      throw new MissingDataException(['email']);
    }

    // Search admin
    const admin = await this.adminRepository.getByEmail(email);

    this.logger.debug('Admin found.', { admin });

    return admin;
  }
}
