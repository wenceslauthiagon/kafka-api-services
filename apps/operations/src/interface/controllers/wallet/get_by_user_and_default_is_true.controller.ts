import { Logger } from 'winston';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Wallet, WalletRepository, WalletState } from '@zro/operations/domain';
import { GetWalletByUserAndDefaultIsTrueUseCase as UseCase } from '@zro/operations/application';

type UserId = User['uuid'];

type TGetWalletByUserAndDefaultIsTrueRequest = {
  userId: UserId;
};

export class GetWalletByUserAndDefaultIsTrueRequest
  extends AutoValidator
  implements TGetWalletByUserAndDefaultIsTrueRequest
{
  @IsUUID(4)
  userId: UserId;

  constructor(props: TGetWalletByUserAndDefaultIsTrueRequest) {
    super(props);
  }
}

type TGetWalletByUserAndDefaultIsTrueResponse = Pick<
  Wallet,
  'uuid' | 'state' | 'createdAt' | 'name'
> & { userId: UserId };

export class GetWalletByUserAndDefaultIsTrueResponse
  extends AutoValidator
  implements TGetWalletByUserAndDefaultIsTrueResponse
{
  @IsUUID(4)
  uuid: string;

  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(WalletState)
  state: WalletState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetWalletByUserAndDefaultIsTrueResponse) {
    super(props);
  }
}

export class GetWalletByUserAndDefaultIsTrueController {
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
      context: GetWalletByUserAndDefaultIsTrueController.name,
    });

    this.usecase = new UseCase(this.logger, walletRepository);
  }

  /**
   * Search wallet by user and default is  response.
   *
   * @param request Input data.
   * @returns Wallet if found or null otherwise.
   */
  async execute(
    request: GetWalletByUserAndDefaultIsTrueRequest,
  ): Promise<GetWalletByUserAndDefaultIsTrueResponse> {
    this.logger.debug('Get default wallet by user request.', { request });

    const { userId } = request;

    const user = new UserEntity({ uuid: userId });

    const result = await this.usecase.execute(user);

    if (!result) return null;

    const response = new GetWalletByUserAndDefaultIsTrueResponse({
      uuid: result.uuid,
      name: result.name,
      state: result.state,
      userId: result.user.uuid,
      createdAt: result.createdAt,
    });

    this.logger.debug('Get default wallet by user response.', { response });

    return response;
  }
}
