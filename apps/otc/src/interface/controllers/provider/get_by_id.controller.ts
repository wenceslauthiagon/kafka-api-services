import { Logger } from 'winston';
import { IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Provider, ProviderRepository } from '@zro/otc/domain';
import { GetByIdProviderUseCase as UseCase } from '@zro/otc/application';

export type TGetProviderByIdRequest = Pick<Provider, 'id'>;

export class GetProviderByIdRequest
  extends AutoValidator
  implements TGetProviderByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetProviderByIdRequest) {
    super(props);
  }
}

export type TGetProviderByIdResponse = Pick<
  Provider,
  'id' | 'name' | 'description' | 'createdAt'
>;

export class GetProviderByIdResponse
  extends AutoValidator
  implements TGetProviderByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetProviderByIdResponse) {
    super(props);
  }
}

export class GetProviderByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    providerRepository: ProviderRepository,
  ) {
    this.logger = logger.child({ context: GetProviderByIdController.name });

    this.usecase = new UseCase(this.logger, providerRepository);
  }

  async execute(
    request: GetProviderByIdRequest,
  ): Promise<GetProviderByIdResponse> {
    const { id } = request;
    this.logger.debug('Get by Provider ID.', { request });

    const provider = await this.usecase.execute(id);

    if (!provider) return null;

    const response = new GetProviderByIdResponse({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      createdAt: provider.createdAt,
    });

    return response;
  }
}
