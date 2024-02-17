import { Logger } from 'winston';
import { IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';
import { UpdateUserPropsUseCase } from '@zro/users/application';

interface TUpdateUserPropsRequest {
  uuid: User['uuid'];
  propKey: string;
  propValue: string;
}

export class UpdateUserPropsRequest
  extends AutoValidator
  implements TUpdateUserPropsRequest
{
  @IsUUID(4)
  uuid: string;

  @IsString()
  @MaxLength(255)
  propKey: string;

  @IsString()
  @MaxLength(255)
  propValue: string;

  constructor(props: TUpdateUserPropsRequest) {
    super(props);
  }
}

interface TUpdateUserPropsResponse {
  uuid: User['uuid'];
  propKey: string;
  propValue: string;
}

export class UpdateUserPropsResponse
  extends AutoValidator
  implements TUpdateUserPropsResponse
{
  @IsUUID(4)
  uuid: string;

  @IsString()
  @MaxLength(255)
  propKey: string;

  @IsString()
  @MaxLength(255)
  propValue: string;

  constructor(props: TUpdateUserPropsResponse) {
    super(props);
  }
}

export class UpdateUserPropsController {
  private usecase: UpdateUserPropsUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: UpdateUserPropsController.name });
    this.usecase = new UpdateUserPropsUseCase(logger, userRepository);
  }

  async execute(
    request: UpdateUserPropsRequest,
  ): Promise<UpdateUserPropsResponse> {
    this.logger.debug('Updating user props request.', { request });

    const { uuid, propKey, propValue } = request;

    const user = await this.usecase.execute(uuid, propKey, propValue);

    if (!user) return null;

    const response = new UpdateUserPropsResponse({
      uuid: user.uuid,
      propKey,
      propValue,
    });

    return response;
  }
}
