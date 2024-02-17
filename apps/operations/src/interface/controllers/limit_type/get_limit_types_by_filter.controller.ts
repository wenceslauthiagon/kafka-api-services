import { Logger } from 'winston';
import { Pagination, PaginationEntity, TPaginationResponse } from '@zro/common';
import {
  LimitType,
  LimitTypeFilter,
  LimitTypeRepository,
} from '@zro/operations/domain';
import { GetLimitTypesByFilterUseCase as UseCase } from '@zro/operations/application';

export enum GetLimitTypesByFilterRequestSort {
  ID = 'id',
}

export type GetLimitTypesByFilterRequest = Pagination & LimitTypeFilter;

export interface GetLimitTypeByFilterItem {
  id: number;
  tag: string;
}

export type GetLimitTypesByFilterResponse =
  TPaginationResponse<GetLimitTypeByFilterItem>;

function getLimitTypesByFilterPresenter(
  LimitTypes: LimitType[],
): GetLimitTypeByFilterItem[] {
  if (!LimitTypes) return null;

  const response = LimitTypes.map<GetLimitTypeByFilterItem>((limitType) => ({
    id: limitType.id,
    tag: limitType.tag,
  }));

  return response;
}

export class GetLimitTypesByFilterController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    limitTypeRepository: LimitTypeRepository,
  ) {
    this.logger = logger.child({
      context: GetLimitTypesByFilterController.name,
    });

    this.usecase = new UseCase(this.logger, limitTypeRepository);
  }

  async execute(
    request: GetLimitTypesByFilterRequest,
  ): Promise<GetLimitTypesByFilterResponse> {
    this.logger.debug('Get Limit types request.', { request });

    const { order, page, pageSize, sort, tag, transactionTypeTag } = request;

    const filter: LimitTypeFilter = {
      ...(tag && { tag }),
      ...(transactionTypeTag && { transactionTypeTag }),
    };

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const results = await this.usecase.execute(filter, pagination);

    return {
      ...results,
      data: getLimitTypesByFilterPresenter(results.data),
    };
  }
}
