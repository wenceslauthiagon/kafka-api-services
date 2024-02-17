import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { UserEntity, UserState } from '@zro/users/domain';
import {
  CurrencyRepository,
  UserWalletRepository,
  WalletAccountRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { CreatePendingWalletUseCase as UseCase } from '@zro/operations/application';
import { UserEvent } from '@zro/users/application';

type THandlePendingUserEventRequest = Pick<
  UserEvent,
  'id' | 'uuid' | 'name' | 'state' | 'phoneNumber'
>;

export class HandlePendingUserEventRequest
  extends AutoValidator
  implements THandlePendingUserEventRequest
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(UserState)
  state: UserState;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  constructor(props: THandlePendingUserEventRequest) {
    super(props);
  }
}

export class HandlePendingUserEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletRepository: WalletRepository,
    walletAccountRepository: WalletAccountRepository,
    currencyRepository: CurrencyRepository,
    userWalletRepository: UserWalletRepository,
    permissionRootTag: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingUserEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      walletRepository,
      walletAccountRepository,
      currencyRepository,
      userWalletRepository,
      permissionRootTag,
    );
  }

  async execute(request: HandlePendingUserEventRequest): Promise<void> {
    this.logger.debug('Create pending wallet request.', { request });

    const user = new UserEntity({ uuid: request.uuid, id: request.id });

    const response = await this.usecase.execute(user);

    this.logger.debug('Create pending wallet response.', { response });
  }
}
