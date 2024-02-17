import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  HandleCancelPendingPixRefundEventUseCase as UseCase,
  PixRefundGateway,
} from '@zro/pix-payments/application';
import {
  PixRefund,
  PixRefundRepository,
  PixRefundState,
} from '@zro/pix-payments/domain';
import {
  PixRefundEventEmitterController,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type THandleCancelPendingPixRefundEventRequest = Pick<PixRefund, 'id'>;

export class HandleCancelPendingPixRefundEventRequest
  extends AutoValidator
  implements THandleCancelPendingPixRefundEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundState)
  state!: PixRefundState;

  constructor(props: THandleCancelPendingPixRefundEventRequest) {
    super(props);
  }
}

type THandleCancelPendingPixRefundEventResponse = Pick<
  PixRefund,
  'id' | 'state' | 'createdAt'
>;

export class HandleCancelPendingPixRefundEventResponse
  extends AutoValidator
  implements THandleCancelPendingPixRefundEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixRefundState)
  state!: PixRefundState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleCancelPendingPixRefundEventResponse) {
    super(props);
  }
}

export class HandleCancelPendingPixRefundEventController {
  /**
   * Handler triggered when PixRefund was notified successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixRefundRepository PixRefund repository.
   * @param pixRefundGateway PSP gateway instance.
   * @param eventEmitter PixRefund event emitter.
   */
  constructor(
    private logger: Logger,
    repository: PixRefundRepository,
    pixRefundGateway: PixRefundGateway,
    eventEmitter: PixRefundEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleCancelPendingPixRefundEventController.name,
    });

    const controllerEventEmitter = new PixRefundEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      repository,
      pixRefundGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleCancelPendingPixRefundEventRequest,
  ): Promise<HandleCancelPendingPixRefundEventResponse> {
    this.logger.debug('Handle cancel pixRefund.', { request });

    const { id } = request;

    const pixRefund = await this.usecase.execute(id);

    if (!pixRefund) return null;

    const response = new HandleCancelPendingPixRefundEventResponse({
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
