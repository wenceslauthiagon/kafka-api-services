import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import {
  HandlePendingPixDevolutionEventUseCase as UseCase,
  OperationService,
  PixDevolutionEvent,
  PixPaymentGateway,
} from '@zro/pix-payments/application';
import {
  PaymentRepository,
  PixDepositRepository,
  PixDevolution,
  PixDevolutionReceivedRepository,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionEventEmitterController,
  PixDevolutionEventEmitterControllerInterface,
  PixDevolutionReceivedEventEmitterController,
  PixDevolutionReceivedEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandlePendingPixDevolutionEventRequest = Pick<
  PixDevolutionEvent,
  'id' | 'state'
> & { userId: UserId; walletId: WalletId };

export class HandlePendingPixDevolutionEventRequest
  extends AutoValidator
  implements THandlePendingPixDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  walletId!: WalletId;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsUUID(4)
  userId: UserId;

  constructor(props: THandlePendingPixDevolutionEventRequest) {
    super(props);
  }
}

type THandlePendingPixDevolutionEventResponse = Pick<
  PixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingPixDevolutionEventResponse
  extends AutoValidator
  implements THandlePendingPixDevolutionEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixDevolutionState)
  state!: PixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingPixDevolutionEventResponse) {
    super(props);
  }
}

export class HandlePendingPixDevolutionEventController {
  /**
   * Handler triggered when devolution was added successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param devolutionRepository PixDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param eventEmitter PixDevolution event emitter.
   * @param pspGateway PixDevolution psp gateway.
   * @param operationService Operation service gateway.
   */
  constructor(
    private logger: Logger,
    devolutionRepository: PixDevolutionRepository,
    depositRepository: PixDepositRepository,
    eventEmitter: PixDevolutionEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
    operationService: OperationService,
    paymentRepository: PaymentRepository,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    devolutionReceivedEventEmitter: PixDevolutionReceivedEventEmitterControllerInterface,
    pixSendDevolutionOperationCurrencyTag: string,
    pixSendDevolutionOperationTransactionTag: string,
    pixDevolutionZroBankIspb: string,
    pixDevolutionReceivedOperationTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingPixDevolutionEventController.name,
    });

    const controllerEventEmitter = new PixDevolutionEventEmitterController(
      eventEmitter,
    );

    const controllerDevolutionReceivedEventEmitter =
      new PixDevolutionReceivedEventEmitterController(
        devolutionReceivedEventEmitter,
      );

    this.usecase = new UseCase(
      this.logger,
      devolutionRepository,
      depositRepository,
      pspGateway,
      controllerEventEmitter,
      operationService,
      paymentRepository,
      devolutionReceivedRepository,
      controllerDevolutionReceivedEventEmitter,
      pixSendDevolutionOperationCurrencyTag,
      pixSendDevolutionOperationTransactionTag,
      pixDevolutionZroBankIspb,
      pixDevolutionReceivedOperationTransactionTag,
    );
  }

  async execute(
    request: HandlePendingPixDevolutionEventRequest,
  ): Promise<HandlePendingPixDevolutionEventResponse> {
    this.logger.debug('Handle pending devolution event by ID request.', {
      request,
    });

    const { id } = request;

    const devolution = await this.usecase.execute(id);

    if (!devolution) return null;

    const response = new HandlePendingPixDevolutionEventResponse({
      id: devolution.id,
      state: devolution.state,
      createdAt: devolution.createdAt,
    });

    this.logger.info('Handle pending devolution event by ID response.', {
      devolution: response,
    });

    return response;
  }
}
