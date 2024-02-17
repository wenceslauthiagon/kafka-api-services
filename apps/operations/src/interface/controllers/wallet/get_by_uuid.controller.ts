import { Logger } from 'winston';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet, WalletRepository, WalletState } from '@zro/operations/domain';
import { GetWalletByUuidUseCase as UseCase } from '@zro/operations/application';

type TGetWalletByUuidRequest = Pick<Wallet, 'uuid'>;

export class GetWalletByUuidRequest
  extends AutoValidator
  implements TGetWalletByUuidRequest
{
  @IsUUID(4)
  uuid: string;

  constructor(props: GetWalletByUuidRequest) {
    super(props);
  }
}

type TGetWalletByUuidResponse = Pick<
  Wallet,
  'id' | 'uuid' | 'state' | 'default' | 'user' | 'name' | 'createdAt'
>;

export class GetWalletByUuidResponse
  extends AutoValidator
  implements TGetWalletByUuidResponse
{
  @IsPositive()
  @IsInt()
  id: number;

  @IsUUID(4)
  uuid: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(WalletState)
  state: WalletState;

  @IsBoolean()
  default: boolean;

  @IsDefined()
  user: User;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetWalletByUuidResponse) {
    super(props);
  }
}

export class GetWalletByUuidController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletRepository: WalletRepository,
  ) {
    this.logger = logger.child({ context: GetWalletByUuidController.name });

    this.usecase = new UseCase(this.logger, walletRepository);
  }

  async execute(
    request: GetWalletByUuidRequest,
  ): Promise<GetWalletByUuidResponse> {
    this.logger.debug('Get wallet by uuid request.', { request });

    const { uuid } = request;

    const wallet = await this.usecase.execute(uuid);

    if (!wallet) return null;

    const response = new GetWalletByUuidResponse({
      id: wallet.id,
      uuid: wallet.uuid,
      name: wallet.name,
      state: wallet.state,
      default: wallet.default,
      user: wallet.user,
      createdAt: wallet.createdAt,
    });

    this.logger.debug('Get wallet by uuid response.', { response });

    return response;
  }
}
