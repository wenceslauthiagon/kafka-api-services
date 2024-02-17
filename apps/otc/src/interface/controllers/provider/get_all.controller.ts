import { Logger } from 'winston';
import { Pagination, TPaginationResponse, PaginationEntity } from '@zro/common';
import { Provider, ProviderRepository } from '@zro/otc/domain';
import { GetAllProviderUseCase as UseCase } from '@zro/otc/application';

export enum GetAllProviderRequestSort {
  ID = 'id',
  NAME = 'name',
  CREATED_AT = 'created_at',
}

export type GetAllProviderRequest = Pagination;

export interface GetAllProviderResponseItem {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export type GetAllProviderResponse =
  TPaginationResponse<GetAllProviderResponseItem>;

function getAllProviderPresenter(
  providers: Provider[],
): GetAllProviderResponseItem[] {
  if (!providers) return null;

  const response = providers.map<GetAllProviderResponseItem>((provider) => ({
    id: provider.id,
    name: provider.name,
    description: provider.description,
    createdAt: provider.createdAt,
  }));

  return response;
}

export class GetAllProviderController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    providerRepository: ProviderRepository,
  ) {
    this.logger = logger.child({
      context: GetAllProviderController.name,
    });
    this.usecase = new UseCase(this.logger, providerRepository);
  }

  async execute(
    request: GetAllProviderRequest,
  ): Promise<GetAllProviderResponse> {
    const { order, page, pageSize, sort } = request;
    this.logger.debug('GetAll Providers.', { request });

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const results = await this.usecase.execute(pagination);

    return {
      ...results,
      data: getAllProviderPresenter(results.data),
    };
  }
}
