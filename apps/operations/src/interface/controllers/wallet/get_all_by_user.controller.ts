import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Wallet, WalletRepository, WalletState } from '@zro/operations/domain';
import { GetAllWalletByUserUseCase as UseCase } from '@zro/operations/application';

type UserId = User['uuid'];

type TGetAllWalletByUserRequest = {
  userId: UserId;
};

export class GetAllWalletByUserRequest
  extends AutoValidator
  implements TGetAllWalletByUserRequest
{
  @IsUUID(4)
  userId: UserId;

  constructor(props: TGetAllWalletByUserRequest) {
    super(props);
  }
}

type TGetAllWalletByUserResponse = Pick<
  Wallet,
  'id' | 'uuid' | 'state' | 'default' | 'name' | 'createdAt'
>;

export class GetAllWalletByUserResponse
  extends AutoValidator
  implements TGetAllWalletByUserResponse
{
  @IsPositive()
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsUUID(4)
  uuid: string;

  @IsEnum(WalletState)
  state: WalletState;

  @IsBoolean()
  default: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllWalletByUserResponse) {
    super(props);
  }
}

export class GetAllWalletByUserController {
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
    this.logger = logger.child({ context: GetAllWalletByUserController.name });
    this.usecase = new UseCase(this.logger, walletRepository);
  }

  /**
   * Search all wallets by.
   *
   * @param request Input data.
   * @returns Wallet[].
   */
  async execute(
    request: GetAllWalletByUserRequest,
  ): Promise<GetAllWalletByUserResponse[]> {
    this.logger.debug('Get wallets by user.', { request });

    const { userId } = request;
    const user = new UserEntity({ uuid: userId });

    const wallets = await this.usecase.execute(user);

    const response = wallets.map(
      (wallet) =>
        new GetAllWalletByUserResponse({
          id: wallet.id,
          name: wallet.name,
          uuid: wallet.uuid,
          state: wallet.state,
          default: wallet.default,
          createdAt: wallet.createdAt,
        }),
    );

    this.logger.debug('Get wallets by user response.', { response });

    return response;
  }
}
