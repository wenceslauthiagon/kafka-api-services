import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Admin, AdminRepository } from '@zro/admin/domain';

export class GetAdminByIdUseCase {
  constructor(
    private logger: Logger,
    private adminRepository: AdminRepository,
  ) {
    this.logger = logger.child({ context: GetAdminByIdUseCase.name });
  }

  /**
   * Get admin by id.
   *
   * @param id Admin id.
   * @returns The admin found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: number): Promise<Admin> {
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search admin
    const admin = await this.adminRepository.getById(id);

    this.logger.debug('Admin found.', { admin });

    return admin;
  }
}
