import { Logger } from 'winston';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { GetPixKeyByKeyAndUserUseCase as UseCase } from '@zro/pix-keys/application';
import { User, UserEntity } from '@zro/users/domain';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';

type UserId = User['uuid'];

type TGetPixKeyByKeyAndUserRequest = Pick<PixKey, 'key'> & { userId: UserId };

export class GetPixKeyByKeyAndUserRequest
  extends AutoValidator
  implements TGetPixKeyByKeyAndUserRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsString()
  @MaxLength(77)
  key: string;

  constructor(props: TGetPixKeyByKeyAndUserRequest) {
    super(props);
  }
}

type TGetPixKeyByKeyAndUserResponse = Pick<
  PixKey,
  'id' | 'key' | 'type' | 'state' | 'createdAt'
>;
export class GetPixKeyByKeyAndUserResponse
  extends AutoValidator
  implements TGetPixKeyByKeyAndUserResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  key: string;

  @IsEnum(KeyType)
  type: KeyType;

  @IsEnum(KeyState)
  state: KeyState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetPixKeyByKeyAndUserResponse) {
    super(props);
  }
}

export class GetPixKeyByKeyAndUserController {
  private usecase: UseCase;
  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({
      context: GetPixKeyByKeyAndUserController.name,
    });
    this.usecase = new UseCase(this.logger, pixKeyRepository);
  }
  async execute(
    request: GetPixKeyByKeyAndUserRequest,
  ): Promise<GetPixKeyByKeyAndUserResponse> {
    const { key, userId } = request;

    const user = new UserEntity({ uuid: userId });

    this.logger.debug('Get by Pix Key.', { request });

    const pixKey = await this.usecase.execute(key, user);

    if (!pixKey) return null;

    const response = new GetPixKeyByKeyAndUserResponse({
      id: pixKey.id,
      key: pixKey.key,
      type: pixKey.type,
      state: pixKey.state,
      createdAt: pixKey.createdAt,
    });

    this.logger.info('Get Pix Key by key response.', {
      pixKey: response,
    });

    return response;
  }
}
