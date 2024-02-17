import { Logger } from 'winston';
import { Provider, ProviderRepository } from '@zro/otc/domain';
import { CreateProviderUseCase as UseCase } from '@zro/otc/application';

export interface CreateProviderRequest {
  id: string;
  name: string;
  description?: string;
}

export interface CreateProviderResponse {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

function createProviderPresenter(provider: Provider): CreateProviderResponse {
  if (!provider) return null;

  const response: CreateProviderResponse = {
    id: provider.id,
    name: provider.name,
    description: provider.description,
    createdAt: provider.createdAt,
  };

  return response;
}

export class CreateProviderController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    providerRepository: ProviderRepository,
  ) {
    this.logger = logger.child({ context: CreateProviderController.name });

    this.usecase = new UseCase(this.logger, providerRepository);
  }

  async execute(
    request: CreateProviderRequest,
  ): Promise<CreateProviderResponse> {
    const { id, name, description } = request;
    this.logger.debug('Create Provider.', { request });

    const provider = await this.usecase.execute(id, name, description);

    return createProviderPresenter(provider);
  }
}
