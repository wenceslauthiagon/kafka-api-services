import { Logger } from 'winston';
import { Provider, ProviderRepository } from '@zro/otc/domain';
import { GetByNameProviderUseCase as UseCase } from '@zro/otc/application';

export interface GetByNameProviderRequest {
  name: string;
}

export interface GetByNameProviderResponse {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

function getByNameProviderPresenter(
  provider: Provider,
): GetByNameProviderResponse {
  if (!provider) return null;

  const response: GetByNameProviderResponse = {
    id: provider.id,
    name: provider.name,
    description: provider.description,
    createdAt: provider.createdAt,
  };

  return response;
}

export class GetByNameProviderController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    providerRepository: ProviderRepository,
  ) {
    this.logger = logger.child({ context: GetByNameProviderController.name });

    this.usecase = new UseCase(this.logger, providerRepository);
  }

  async execute(
    request: GetByNameProviderRequest,
  ): Promise<GetByNameProviderResponse> {
    const { name } = request;
    this.logger.debug('Get by Provider name.', { request });

    const provider = await this.usecase.execute(name);

    return getByNameProviderPresenter(provider);
  }
}
