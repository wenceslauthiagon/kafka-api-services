import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  HandlePendingPixRefundDevolutionEventUseCase as UseCase,
  OperationService,
  PixRefundDevolutionEvent,
  PixPaymentGateway,
} from '@zro/pix-payments/application';
import {
  PixDepositRepository,
  PixRefundDevolution,
  PixDevolutionReceivedRepository,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixRefundDevolutionEventEmitterController,
  PixRefundDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type THandlePendingPixRefundDevolutionEventRequest = Pick<
  PixRefundDevolutionEvent,
  'id' | 'state'
> & { userId: UserId };

export class HandlePendingPixRefundDevolutionEventRequest
  extends AutoValidator
  implements THandlePendingPixRefundDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundDevolutionState)
  state: PixRefundDevolutionState;

  @IsUUID(4)
  userId: UserId;

  constructor(props: THandlePendingPixRefundDevolutionEventRequest) {
    super(props);
  }
}

type THandlePendingPixRefundDevolutionEventResponse = Pick<
  PixRefundDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingPixRefundDevolutionEventResponse
  extends AutoValidator
  implements THandlePendingPixRefundDevolutionEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixRefundDevolutionState)
  state!: PixRefundDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingPixRefundDevolutionEventResponse) {
    super(props);
  }
}

export class HandlePendingPixRefundDevolutionEventController {
  /**
   * Handler triggered when devolution was added successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param refundDevolutionRepository PixRefundDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param eventEmitter PixRefundDevolution event emitter.
   * @param pspGateway PixRefundDevolution psp gateway.
   * @param operationService Operation service gateway.
   */
  constructor(
    private logger: Logger,
    refundDevolutionRepository: PixRefundDevolutionRepository,
    depositRepository: PixDepositRepository,
    eventEmitter: PixRefundDevolutionEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
    operationService: OperationService,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    pixSendDevolutionOperationCurrencyTag: string,
    pixSendDevolutionOperationTransactionTag: string,
    pixDevolutionZroBankIspb: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingPixRefundDevolutionEventController.name,
    });

    const controllerEventEmitter =
      new PixRefundDevolutionEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      refundDevolutionRepository,
      depositRepository,
      pspGateway,
      controllerEventEmitter,
      operationService,
      devolutionReceivedRepository,
      pixSendDevolutionOperationCurrencyTag,
      pixSendDevolutionOperationTransactionTag,
      pixDevolutionZroBankIspb,
    );
  }

  async execute(
    request: HandlePendingPixRefundDevolutionEventRequest,
  ): Promise<HandlePendingPixRefundDevolutionEventResponse> {
    this.logger.debug(
      'Handle pending devorefundDevolutionlution event by ID request.',
      { request },
    );

    const { id } = request;

    const refundDevolution = await this.usecase.execute(id);

    if (!refundDevolution) return null;

    const response = new HandlePendingPixRefundDevolutionEventResponse({
      id: refundDevolution.id,
      state: refundDevolution.state,
      createdAt: refundDevolution.createdAt,
    });

    this.logger.info('Handle pending refundDevolution event by ID response.', {
      refundDevolution: response,
    });

    return response;
  }
}
