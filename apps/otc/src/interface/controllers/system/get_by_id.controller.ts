import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import { System, SystemRepository } from '@zro/otc/domain';
import { GetSystemByIdUseCase as UseCase } from '@zro/otc/application';
import { IsDate, IsString, IsUUID } from 'class-validator';

type TGetSystemByIdRequest = Pick<Required<System>, 'id'>;

export class GetSystemByIdRequest
  extends AutoValidator
  implements TGetSystemByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetSystemByIdRequest) {
    super(props);
  }
}

type TGetSystemByIdResponse = Pick<
  Required<System>,
  'id' | 'name' | 'description' | 'createdAt'
>;

export class GetSystemByIdResponse
  extends AutoValidator
  implements TGetSystemByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsDate()
  createdAt: Date;
}

export class GetSystemByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    systemRepository: SystemRepository,
  ) {
    this.logger = logger.child({ context: GetSystemByIdController.name });

    this.usecase = new UseCase(this.logger, systemRepository);
  }

  async execute(request: GetSystemByIdRequest): Promise<GetSystemByIdResponse> {
    const { id } = request;
    this.logger.debug('Get by System ID.', { request });

    const system = await this.usecase.execute(id);

    if (!system) return null;

    const response: GetSystemByIdResponse = {
      id: system.id,
      name: system.name,
      description: system.description,
      createdAt: system.createdAt,
    };

    return response;
  }
}
