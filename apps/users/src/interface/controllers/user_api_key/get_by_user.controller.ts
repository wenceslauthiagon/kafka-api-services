import { Logger } from 'winston';
import { IsString, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  UserApiKey,
  UserApiKeyRepository,
  User,
  UserEntity,
} from '@zro/users/domain';
import { GetUserApiKeyByUserUseCase as UseCase } from '@zro/users/application';

type UserId = User['uuid'];

type TGetUserApiKeyByUserRequest = { userId: UserId };

export class GetUserApiKeyByUserRequest
  extends AutoValidator
  implements TGetUserApiKeyByUserRequest
{
  @IsUUID(4)
  userId: UserId;

  constructor(props: GetUserApiKeyByUserRequest) {
    super(props);
  }
}

type TGetUserApiKeyByUserResponse = Pick<UserApiKey, 'id' | 'hash'> & {
  userId?: UserId;
};

export class GetUserApiKeyByUserResponse
  extends AutoValidator
  implements TGetUserApiKeyByUserResponse
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  userId?: UserId;

  @IsString()
  hash: string;

  constructor(props: TGetUserApiKeyByUserResponse) {
    super(props);
  }
}

export class GetUserApiKeyByUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userApiKeyRepository: UserApiKeyRepository,
  ) {
    this.logger = logger.child({
      context: GetUserApiKeyByUserController.name,
    });

    this.usecase = new UseCase(this.logger, userApiKeyRepository);
  }

  async execute(
    request: GetUserApiKeyByUserRequest,
  ): Promise<GetUserApiKeyByUserResponse> {
    const { userId } = request;

    this.logger.debug('Get by user request.', { request });

    const user = new UserEntity({ uuid: userId });

    const userApiKey = await this.usecase.execute(user);

    const response =
      userApiKey &&
      new GetUserApiKeyByUserResponse({
        id: userApiKey.id,
        userId: userApiKey.user.uuid,
        hash: userApiKey.hash,
      });

    return response;
  }
}
