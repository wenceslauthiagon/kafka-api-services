import { Admin } from '@zro/admin/domain';

export interface AdminService {
  /**
   * Get an admin by id.
   * @param id admin id.
   * @returns admin  found otherwise null.
   */
  getById(id: number): Promise<Admin>;
}
