import { Logger } from 'winston';
import { Pagination, PaginationEntity, TPaginationResponse } from '@zro/common';
import { System, SystemRepository } from '@zro/otc/domain';
import { GetAllSystemUseCase as UseCase } from '@zro/otc/application';

export enum GetAllSystemRequestSort {
  ID = 'id',
  NAME = 'name',
  CREATED_AT = 'created_at',
}

export type GetAllSystemRequest = Pagination;

export interface GetAllSystemResponseItem {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export type GetAllSystemResponse =
  TPaginationResponse<GetAllSystemResponseItem>;

function getAllSystemPresenter(systems: System[]): GetAllSystemResponseItem[] {
  if (!systems) return null;

  const response = systems.map<GetAllSystemResponseItem>((system) => ({
    id: system.id,
    name: system.name,
    description: system.description,
    createdAt: system.createdAt,
  }));

  return response;
}

export class GetAllSystemController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    systemRepository: SystemRepository,
  ) {
    this.logger = logger.child({
      context: GetAllSystemController.name,
    });
    this.usecase = new UseCase(this.logger, systemRepository);
  }

  async execute(request: GetAllSystemRequest): Promise<GetAllSystemResponse> {
    const { order, page, pageSize, sort } = request;
    this.logger.debug('GetAll Systems.', { request });

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const results = await this.usecase.execute(pagination);

    return {
      ...results,
      data: getAllSystemPresenter(results.data),
    };
  }
}
