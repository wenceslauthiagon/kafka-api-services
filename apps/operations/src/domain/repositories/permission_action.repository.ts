import { Pagination, TPaginationResponse } from '@zro/common';
import { PermissionAction, PermissionType } from '@zro/operations/domain';

export interface PermissionActionRepository {
  /**
   * Get all permission actions by permissionTypes.
   * @param pagination Pagination.
   * @returns Permission actions found or empty otherwise.
   */
  getAllByFilter(
    pagination: Pagination,
    permissionTypes?: PermissionType[],
  ): Promise<TPaginationResponse<PermissionAction>>;
}
