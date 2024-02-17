import { Logger } from 'winston';
import { IsString, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { UserApiKey, UserApiKeyRepository, User } from '@zro/users/domain';
import { GetUserApiKeyByIdUseCase as UseCase } from '@zro/users/application';

type UserId = User['uuid'];

type TGetUserApiKeyByIdRequest = Pick<UserApiKey, 'id'>;

export class GetUserApiKeyByIdRequest
  extends AutoValidator
  implements TGetUserApiKeyByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: GetUserApiKeyByIdRequest) {
    super(props);
  }
}

type TGetUserApiKeyByIdResponse = Pick<UserApiKey, 'id' | 'hash'> & {
  userId?: UserId;
};

export class GetUserApiKeyByIdResponse
  extends AutoValidator
  implements TGetUserApiKeyByIdResponse
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  userId?: UserId;

  @IsString()
  hash: string;

  constructor(props: TGetUserApiKeyByIdResponse) {
    super(props);
  }
}

export class GetUserApiKeyByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userApiKeyRepository: UserApiKeyRepository,
  ) {
    this.logger = logger.child({
      context: GetUserApiKeyByIdController.name,
    });

    this.usecase = new UseCase(this.logger, userApiKeyRepository);
  }

  async execute(
    request: GetUserApiKeyByIdRequest,
  ): Promise<GetUserApiKeyByIdResponse> {
    const { id } = request;
    this.logger.debug('Get by UserApiKey id request.', { request });

    const userApiKey = await this.usecase.execute(id);

    if (!userApiKey) return null;

    const response = new GetUserApiKeyByIdResponse({
      id: userApiKey.id,
      userId: userApiKey.user.uuid,
      hash: userApiKey.hash,
    });

    return response;
  }
}
