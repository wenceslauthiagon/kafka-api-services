import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  PermissionAction,
  PermissionActionRepository,
  PermissionType,
} from '@zro/operations/domain';

export class GetAllPermissionActionByPermissionTypesUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param permissionActionRepository PermissionAction repository.
   * @param permissionRootTag PermissionType Root tag.
   */
  constructor(
    private logger: Logger,
    private readonly permissionActionRepository: PermissionActionRepository,
    private readonly permissionRootTag: string,
  ) {
    this.logger = logger.child({
      context: GetAllPermissionActionByPermissionTypesUseCase.name,
    });
  }

  async execute(
    pagination: Pagination,
    permissionTypes?: PermissionType[],
  ): Promise<TPaginationResponse<PermissionAction>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // If Permission is ROOT, get all actions, so ignore permission filter.
    if (
      permissionTypes?.length &&
      permissionTypes.some((i) => i.tag === this.permissionRootTag)
    ) {
      permissionTypes = null;
    }

    const result = await this.permissionActionRepository.getAllByFilter(
      pagination,
      permissionTypes,
    );

    this.logger.debug('PermissionActions found.', { total: result.total });

    return result;
  }
}
