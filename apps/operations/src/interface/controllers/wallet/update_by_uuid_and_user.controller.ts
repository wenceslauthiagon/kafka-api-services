import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Wallet, WalletRepository, WalletState } from '@zro/operations/domain';
import { UpdateWalletByUuidAndUserUseCase as UseCase } from '@zro/operations/application';

type UserId = User['uuid'];

type TUpdateWalletByUuidAndUserRequest = Pick<Wallet, 'uuid' | 'name'> & {
  userId: UserId;
};

export class UpdateWalletByUuidAndUserRequest
  extends AutoValidator
  implements TUpdateWalletByUuidAndUserRequest
{
  @IsUUID(4)
  uuid: string;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @Length(1, 255)
  name: string;

  constructor(props: TUpdateWalletByUuidAndUserRequest) {
    super(props);
  }
}

type TUpdateWalletByUuidAndUserResponse = Pick<
  Wallet,
  'id' | 'uuid' | 'state' | 'default' | 'name' | 'createdAt'
> & { userId: UserId };

export class UpdateWalletByUuidAndUserResponse
  extends AutoValidator
  implements TUpdateWalletByUuidAndUserResponse
{
  @IsPositive()
  @IsInt()
  id: number;

  @IsUUID(4)
  uuid: string;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @Length(1, 255)
  name: string;

  @IsEnum(WalletState)
  state: WalletState;

  @IsBoolean()
  default: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TUpdateWalletByUuidAndUserResponse) {
    super(props);
  }
}

export class UpdateWalletByUuidAndUserController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletRepository Wallet repository.
   */
  constructor(
    private logger: Logger,
    walletRepository: WalletRepository,
  ) {
    this.logger = logger.child({
      context: UpdateWalletByUuidAndUserController.name,
    });

    this.usecase = new UseCase(this.logger, walletRepository);
  }

  /**
   * Search wallet by user and default is true.
   *
   * @param request Input data.
   * @returns Wallet if found or null otherwise.
   */
  async execute(
    request: UpdateWalletByUuidAndUserRequest,
  ): Promise<UpdateWalletByUuidAndUserResponse> {
    this.logger.debug('Update wallet by uuid and user request.', { request });

    const { uuid, name, userId } = request;
    const user = new UserEntity({ uuid: userId });

    const result = await this.usecase.execute(uuid, name, user);

    const response = new UpdateWalletByUuidAndUserResponse({
      id: result.id,
      uuid: result.uuid,
      userId: result.user.uuid,
      name: result.name,
      state: result.state,
      default: result.default,
      createdAt: result.createdAt,
    });

    this.logger.debug('Update wallet by uuid and user response.', { response });

    return response;
  }
}
