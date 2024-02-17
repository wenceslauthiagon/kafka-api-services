import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  HandleCreatePixRefundDevolutionEventUseCase as UseCase,
  PixRefundDevolutionEvent,
} from '@zro/pix-payments/application';
import {
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfractionRefundOperationRepository,
  PixRefund,
  PixRefundDevolution,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import {
  PixRefundDevolutionEventEmitterController,
  PixRefundDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type PixRefundId = PixRefund['id'];

type THandleCreatePixRefundDevolutionEventRequest = Pick<
  PixRefundDevolutionEvent,
  'id' | 'state'
> & { refundId: PixRefundId };

export class HandleCreatePixRefundDevolutionEventRequest
  extends AutoValidator
  implements THandleCreatePixRefundDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundDevolutionState)
  state: PixRefundDevolutionState;

  @IsUUID(4)
  refundId: PixRefundId;

  constructor(props: THandleCreatePixRefundDevolutionEventRequest) {
    super(props);
  }
}

type THandleCreatePixRefundDevolutionEventResponse = Pick<
  PixRefundDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandleCreatePixRefundDevolutionEventResponse
  extends AutoValidator
  implements THandleCreatePixRefundDevolutionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundDevolutionState)
  state: PixRefundDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCreatePixRefundDevolutionEventResponse) {
    super(props);
  }
}

export class HandleCreatePixRefundDevolutionEventController {
  /**
   * Handler triggered when pixDevolution was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param devolutionRepository PixRefundDevolution repository.
   * @param eventEmitter PixRefundDevolution event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    refundDevolutionRepository: PixRefundDevolutionRepository,
    refundRepository: PixRefundRepository,
    eventRefundDevolutionEmitter: PixRefundDevolutionEventEmitterControllerInterface,
    depositRepository: PixDepositRepository,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    refundDevolutionMaxNumber: number,
    transactionRefundDevolutionIntervalDays: number,
  ) {
    this.logger = logger.child({
      context: HandleCreatePixRefundDevolutionEventController.name,
    });

    const controllerRefundDevolutionEventEmitter =
      new PixRefundDevolutionEventEmitterController(
        eventRefundDevolutionEmitter,
      );

    this.usecase = new UseCase(
      this.logger,
      refundDevolutionRepository,
      refundRepository,
      controllerRefundDevolutionEventEmitter,
      depositRepository,
      devolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      refundDevolutionMaxNumber,
      transactionRefundDevolutionIntervalDays,
    );
  }

  async execute(
    request: HandleCreatePixRefundDevolutionEventRequest,
  ): Promise<HandleCreatePixRefundDevolutionEventResponse> {
    this.logger.debug('Handle create event by ID request.', { request });

    const { id, refundId } = request;

    const refundDevolution = await this.usecase.execute(id, refundId);

    if (!refundDevolution) return null;

    const response = new HandleCreatePixRefundDevolutionEventResponse({
      id: refundDevolution.id,
      state: refundDevolution.state,
      createdAt: refundDevolution.createdAt,
    });

    this.logger.info('Handle create event by ID response.', {
      refundDevolution: response,
    });

    return response;
  }
}
