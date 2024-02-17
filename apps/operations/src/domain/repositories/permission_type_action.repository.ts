import { PermissionTypeAction } from '@zro/operations/domain';

export interface PermissionTypeActionRepository {
  /**
   * Get permission type actions.
   * @returns Permission type actions found or empty otherwise.
   */
  getAll(): Promise<PermissionTypeAction[]>;
}
