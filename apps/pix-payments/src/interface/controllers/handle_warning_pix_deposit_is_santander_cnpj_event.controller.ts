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
import { Wallet } from '@zro/operations/domain';
import {
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  HandleWarningPixDepositIsSantanderCnpjEventUseCase as UseCase,
  PixDepositEvent,
} from '@zro/pix-payments/application';
import {
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleWarningPixDepositIsSantanderCnpjEventRequest = Pick<
  PixDepositEvent,
  'id' | 'state' | 'amount' | 'thirdPartName'
> & { userId: UserId; walletId: WalletId };

export class HandleWarningPixDepositIsSantanderCnpjEventRequest
  extends AutoValidator
  implements THandleWarningPixDepositIsSantanderCnpjEventRequest
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

  constructor(props: THandleWarningPixDepositIsSantanderCnpjEventRequest) {
    super(props);
  }
}

type THandleWarningPixDepositIsSantanderCnpjEventResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;

export class HandleWarningPixDepositIsSantanderCnpjEventResponse
  extends AutoValidator
  implements THandleWarningPixDepositIsSantanderCnpjEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixDepositState)
  state!: PixDepositState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleWarningPixDepositIsSantanderCnpjEventResponse) {
    super(props);
  }
}

export class HandleWarningPixDepositIsSantanderCnpjEventController {
  /**
   * Handler triggered when deposit received was added successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Cache Repository.
   * @param pixDepositEventEmitter Pix Deposit Event Emitter.
   * @param pixPaymentSantanderIspb Santander ispb.
   * @param warningPixDepositMinAmount Deposit minimum amount to be considered a warning pix.
   * @param warningPixDepositSantanderCnpj Santander account cnpj to be considered a warning pix.
   */
  constructor(
    private logger: Logger,
    pixDepositCacheRepository: PixDepositCacheRepository,
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    pixPaymentSantanderIspb: string,
    warningPixDepositMinAmount: number,
    warningPixDepositSantanderCnpj: string,
  ) {
    this.logger = logger.child({
      context: HandleWarningPixDepositIsSantanderCnpjEventController.name,
    });

    const eventEmitter = new PixDepositEventEmitterController(
      pixDepositEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixDepositCacheRepository,
      eventEmitter,
      pixPaymentSantanderIspb,
      warningPixDepositMinAmount,
      warningPixDepositSantanderCnpj,
    );
  }

  async execute(
    request: HandleWarningPixDepositIsSantanderCnpjEventRequest,
  ): Promise<HandleWarningPixDepositIsSantanderCnpjEventResponse> {
    this.logger.debug('Handle received deposit event request.', { request });

    const { id } = request;

    const pixDeposit = await this.usecase.execute(id);

    if (!pixDeposit) return null;

    const response = new HandleWarningPixDepositIsSantanderCnpjEventResponse({
      id: pixDeposit.id,
      state: pixDeposit.state,
      createdAt: pixDeposit.createdAt,
    });

    this.logger.info('Handle received deposit.', { pixDeposit: response });

    return response;
  }
}
