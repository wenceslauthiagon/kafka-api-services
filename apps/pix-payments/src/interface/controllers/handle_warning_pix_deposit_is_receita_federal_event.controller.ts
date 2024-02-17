import { Logger } from 'winston';
import {
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
import {
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import { Wallet } from '@zro/operations/domain';
import {
  HandleWarningPixDepositIsReceitaFederalEventUseCase as UseCase,
  PixDepositEvent,
} from '@zro/pix-payments/application';
import {
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleWarningPixDepositIsReceitaFederalEventRequest = Pick<
  PixDepositEvent,
  'id' | 'state'
> & { userId: UserId; walletId: WalletId };

export class HandleWarningPixDepositIsReceitaFederalEventRequest
  extends AutoValidator
  implements THandleWarningPixDepositIsReceitaFederalEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDepositState)
  state: PixDepositState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName?: string;

  constructor(props: THandleWarningPixDepositIsReceitaFederalEventRequest) {
    super(props);
  }
}

type THandleWarningPixDepositIsReceitaFederalEventResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;

export class HandleWarningPixDepositIsReceitaFederalEventResponse
  extends AutoValidator
  implements THandleWarningPixDepositIsReceitaFederalEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixDepositState)
  state!: PixDepositState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleWarningPixDepositIsReceitaFederalEventResponse) {
    super(props);
  }
}

export class HandleWarningPixDepositIsReceitaFederalEventController {
  /**
   * Handler triggered when deposit received was added successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Cache Repository.
   * @param pixDepositEventEmitter Pix Deposit Event Emitter.
   * @param pixPaymentReceitaFederalCnpj Receita federal document (cnpj).
   */
  constructor(
    private logger: Logger,
    pixDepositCacheRepository: PixDepositCacheRepository,
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    pixPaymentReceitaFederalCnpj: string,
  ) {
    this.logger = logger.child({
      context: HandleWarningPixDepositIsReceitaFederalEventController.name,
    });

    const eventEmitter = new PixDepositEventEmitterController(
      pixDepositEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixDepositCacheRepository,
      eventEmitter,
      pixPaymentReceitaFederalCnpj,
    );
  }

  async execute(
    request: HandleWarningPixDepositIsReceitaFederalEventRequest,
  ): Promise<HandleWarningPixDepositIsReceitaFederalEventResponse> {
    this.logger.debug('Handle received deposit event request.', { request });

    const { id } = request;

    const pixDeposit = await this.usecase.execute(id);

    if (!pixDeposit) return null;

    const response = new HandleWarningPixDepositIsReceitaFederalEventResponse({
      id: pixDeposit.id,
      state: pixDeposit.state,
      createdAt: pixDeposit.createdAt,
    });

    this.logger.info('Handle received deposit.', { pixDeposit: response });

    return response;
  }
}
