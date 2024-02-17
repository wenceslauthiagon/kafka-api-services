import { PermissionType } from '@zro/operations/domain';

export interface PermissionTypeRepository {
  /**
   * Get all permission types.
   * @returns Permission types found or empty otherwise.
   */
  getAll(): Promise<PermissionType[]>;
}
