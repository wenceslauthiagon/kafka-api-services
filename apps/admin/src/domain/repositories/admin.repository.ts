import { Admin } from '@zro/admin/domain';

export interface AdminRepository {
  /**
   * Get admin by email.
   * @param email The email.
   * @returns The admin if found or null otherwise.
   */
  getByEmail: (email: string) => Promise<Admin>;

  /**
   * Get admin by email.
   * @param id Admin id.
   * @returns The admin if found or null otherwise.
   */
  getById: (id: number) => Promise<Admin>;

  /**
   * Update admin.
   *
   * @param admin Admin.
   * @returns Updated admin.
   */
  update: (admin: Admin) => Promise<Admin>;
}
