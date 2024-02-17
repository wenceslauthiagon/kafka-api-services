import { Logger } from 'winston';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import {
  HandleRevertPixRefundEventUseCase as UseCase,
  PixRefundEvent,
} from '@zro/pix-payments/application';
import {
  PixRefundEventEmitterController,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  PixRefund,
  PixRefundRepository,
  PixRefundState,
} from '@zro/pix-payments/domain';

type THandleRevertPixRefundEventRequest = PixRefundEvent & {
  failed?: Failed;
};

export class HandleRevertPixRefundEventRequest
  extends AutoValidator
  implements THandleRevertPixRefundEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundState)
  state: PixRefundState;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  constructor(props: THandleRevertPixRefundEventRequest) {
    super(props);
  }
}

type THandleRevertPixRefundEventResponse = Pick<
  PixRefund,
  'id' | 'state' | 'createdAt'
>;

export class HandleRevertPixRefundEventResponse
  extends AutoValidator
  implements THandleRevertPixRefundEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundState)
  state: PixRefundState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleRevertPixRefundEventResponse) {
    super(props);
  }
}

export class HandleRevertPixRefundEventController {
  /**
   * Handler triggered when an revert is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param repository PixRefund repository.
   * @param eventEmitter PixRefund event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    repository: PixRefundRepository,
    eventEmitter: PixRefundEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleRevertPixRefundEventController.name,
    });

    const controllerEventEmitter = new PixRefundEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(this.logger, repository, controllerEventEmitter);
  }

  async execute(
    request: HandleRevertPixRefundEventRequest,
  ): Promise<HandleRevertPixRefundEventResponse> {
    this.logger.debug('Handle revert event by ID request.', { request });

    const { id, failed } = request;

    const refund = await this.usecase.execute(id, failed);

    if (!refund) return null;

    const response = new HandleRevertPixRefundEventResponse({
      id: refund.id,
      state: refund.state,
      createdAt: refund.createdAt,
    });

    this.logger.info('Handle revert event by ID response.', {
      refund: response,
    });

    return response;
  }
}
