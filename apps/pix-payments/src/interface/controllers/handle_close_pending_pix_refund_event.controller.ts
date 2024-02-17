import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { HandleClosePendingPixRefundEventUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixRefund,
  PixRefundRepository,
  PixRefundState,
} from '@zro/pix-payments/domain';
import {
  PixRefundEventEmitterController,
  PixRefundEventEmitterControllerInterface,
  PixRefundDevolutionEventEmitterControllerInterface,
  PixRefundDevolutionEventEmitterController,
} from '@zro/pix-payments/interface';

export type THandleClosePendingPixRefundEventRequest = Pick<PixRefund, 'id'>;

export class HandleClosePendingPixRefundEventRequest
  extends AutoValidator
  implements THandleClosePendingPixRefundEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundState)
  state!: PixRefundState;

  constructor(props: THandleClosePendingPixRefundEventRequest) {
    super(props);
  }
}

type THandleClosePendingPixRefundEventResponse = Pick<
  PixRefund,
  'id' | 'state' | 'createdAt'
>;

export class HandleClosePendingPixRefundEventResponse
  extends AutoValidator
  implements THandleClosePendingPixRefundEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixRefundState)
  state!: PixRefundState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleClosePendingPixRefundEventResponse) {
    super(props);
  }
}

export class HandleClosePendingPixRefundEventController {
  /**
   * Handler triggered when PixRefund was notified successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixRefund repository.
   * @param eventEmitter PixRefundEventEmitter.
   * @param eventEmitterRefundDevolution PixRefundDevolutionEventEmitter.
   */
  constructor(
    private logger: Logger,
    refundRepository: PixRefundRepository,
    eventEmitter: PixRefundEventEmitterControllerInterface,
    eventEmitterRefundDevolution: PixRefundDevolutionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleClosePendingPixRefundEventController.name,
    });

    const controllerRefundEventEmitter = new PixRefundEventEmitterController(
      eventEmitter,
    );

    const controllerRefundDevolutionEventEmitter =
      new PixRefundDevolutionEventEmitterController(
        eventEmitterRefundDevolution,
      );

    this.usecase = new UseCase(
      this.logger,
      refundRepository,
      controllerRefundEventEmitter,
      controllerRefundDevolutionEventEmitter,
    );
  }

  async execute(
    request: HandleClosePendingPixRefundEventRequest,
  ): Promise<HandleClosePendingPixRefundEventResponse> {
    this.logger.debug('Handle close pixRefund.', { request });

    const { id } = request;

    const pixRefund = await this.usecase.execute(id);

    if (!pixRefund) return null;

    const response = new HandleClosePendingPixRefundEventResponse({
      id: pixRefund.id,
      state: pixRefund.state,
      createdAt: pixRefund.createdAt,
    });

    this.logger.info('Handle pending pixRefund event by ID response.', {
      pixRefund: response,
    });

    return response;
  }
}
