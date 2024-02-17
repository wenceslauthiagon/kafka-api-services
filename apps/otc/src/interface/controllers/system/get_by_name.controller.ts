import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import { System, SystemRepository } from '@zro/otc/domain';
import { GetSystemByNameUseCase as UseCase } from '@zro/otc/application';
import { IsDate, IsString, IsUUID, MaxLength } from 'class-validator';

type TGetSystemByNameRequest = Pick<Required<System>, 'name'>;

export class GetSystemByNameRequest
  extends AutoValidator
  implements TGetSystemByNameRequest
{
  @IsString()
  @MaxLength(255)
  name: string;

  constructor(props: TGetSystemByNameRequest) {
    super(props);
  }
}

type TGetSystemByNameResponse = Pick<
  Required<System>,
  'id' | 'name' | 'description' | 'createdAt'
>;

export class GetSystemByNameResponse
  extends AutoValidator
  implements TGetSystemByNameResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsDate()
  createdAt: Date;
}

export class GetSystemByNameController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    systemRepository: SystemRepository,
  ) {
    this.logger = logger.child({ context: GetSystemByNameController.name });

    this.usecase = new UseCase(this.logger, systemRepository);
  }

  async execute(
    request: GetSystemByNameRequest,
  ): Promise<GetSystemByNameResponse> {
    const { name } = request;
    this.logger.debug('Get by System name.', { request });

    const system = await this.usecase.execute(name);

    if (!system) return null;

    const response: GetSystemByNameResponse = {
      id: system.id,
      name: system.name,
      description: system.description,
      createdAt: system.createdAt,
    };

    return response;
  }
}
