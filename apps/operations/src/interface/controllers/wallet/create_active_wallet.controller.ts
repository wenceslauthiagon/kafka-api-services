import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  CurrencyRepository,
  UserWalletRepository,
  Wallet,
  WalletAccountRepository,
  WalletRepository,
  WalletState,
} from '@zro/operations/domain';
import { CreateActiveWalletUseCase as UseCase } from '@zro/operations/application';

type UserId = User['id'];
type UserUuid = User['uuid'];

type TCreateActiveWalletRequest = Pick<Wallet, 'uuid' | 'name'> & {
  userId: UserId;
  userUuid: UserUuid;
};

export class CreateActiveWalletRequest
  extends AutoValidator
  implements TCreateActiveWalletRequest
{
  @IsUUID(4)
  uuid: string;

  // TODO: Remove this when wallet user id is removed
  @IsInt()
  @IsPositive()
  userId: UserId;

  @IsUUID(4)
  userUuid: UserUuid;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  name: string;

  constructor(props: TCreateActiveWalletRequest) {
    super(props);
  }
}

type TCreateActiveWalletResponse = Pick<
  Wallet,
  'id' | 'uuid' | 'state' | 'default' | 'name' | 'createdAt'
> & { userId: UserUuid };

export class CreateActiveWalletResponse
  extends AutoValidator
  implements TCreateActiveWalletResponse
{
  @IsPositive()
  @IsInt()
  id: number;

  @IsUUID(4)
  uuid: string;

  @IsUUID(4)
  userId: UserUuid;

  @IsOptional()
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

  constructor(props: TCreateActiveWalletResponse) {
    super(props);
  }
}

export class CreateActiveWalletController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletRepository Wallet repository.
   */
  constructor(
    private logger: Logger,
    walletRepository: WalletRepository,
    walletAccountRepository: WalletAccountRepository,
    currencyRepository: CurrencyRepository,
    userWalletRepository: UserWalletRepository,
    walletMaxNumber: number,
    permissionRootTag: string,
  ) {
    this.logger = logger.child({ context: CreateActiveWalletController.name });

    this.usecase = new UseCase(
      this.logger,
      walletRepository,
      walletAccountRepository,
      currencyRepository,
      userWalletRepository,
      walletMaxNumber,
      permissionRootTag,
    );
  }

  /**
   * Create wallet by user.
   *
   * @param request Input data.
   * @returns Wallet if found or null otherwise.
   */
  async execute(
    request: CreateActiveWalletRequest,
  ): Promise<CreateActiveWalletResponse> {
    this.logger.debug('Create active wallet request.', { request });

    const { userId, userUuid } = request;

    const user = new UserEntity({ id: userId, uuid: userUuid });

    const result = await this.usecase.execute(request.uuid, request.name, user);

    const response = new CreateActiveWalletResponse({
      id: result.id,
      uuid: result.uuid,
      userId: result.user.uuid,
      name: result.name,
      state: result.state,
      default: result.default,
      createdAt: result.createdAt,
    });

    this.logger.debug('Create active wallet response.', { response });

    return response;
  }
}
