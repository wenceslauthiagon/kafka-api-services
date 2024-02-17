import { Logger } from 'winston';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  HandleCompletePixRefundDevolutionEventUseCase as UseCase,
  OperationService,
  PixRefundDevolutionEvent,
  PixRefundGateway,
} from '@zro/pix-payments/application';
import {
  PixInfractionRefundOperationRepository,
  PixRefundDevolution,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import {
  PixRefundDevolutionEventEmitterController,
  PixRefundDevolutionEventEmitterControllerInterface,
  PixRefundEventEmitterControllerInterface,
  PixRefundEventEmitterController,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type THandleCompletePixRefundDevolutionEventRequest = Pick<
  PixRefundDevolutionEvent,
  'id' | 'state' | 'endToEndId'
> & { userId: UserId };

export class HandleCompletePixRefundDevolutionEventRequest
  extends AutoValidator
  implements THandleCompletePixRefundDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId?: string;

  @IsEnum(PixRefundDevolutionState)
  state: PixRefundDevolutionState;

  @IsUUID(4)
  userId: UserId;

  constructor(props: THandleCompletePixRefundDevolutionEventRequest) {
    super(props);
  }
}

type THandleCompletePixRefundDevolutionEventResponse = Pick<
  PixRefundDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandleCompletePixRefundDevolutionEventResponse
  extends AutoValidator
  implements THandleCompletePixRefundDevolutionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundDevolutionState)
  state: PixRefundDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCompletePixRefundDevolutionEventResponse) {
    super(props);
  }
}

export class HandleCompletePixRefundDevolutionEventController {
  /**
   * Handler triggered when pixDevolution was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param devolutionRepository PixRefundDevolution repository.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param eventEmitter PixRefundDevolution event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    refundDevolutionRepository: PixRefundDevolutionRepository,
    refundRepository: PixRefundRepository,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    operationService: OperationService,
    pixRefundGateway: PixRefundGateway,
    eventRefundEmitter: PixRefundEventEmitterControllerInterface,
    eventRefundDevolutionEmitter: PixRefundDevolutionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleCompletePixRefundDevolutionEventController.name,
    });

    const controllerRefundDevolutionEventEmitter =
      new PixRefundDevolutionEventEmitterController(
        eventRefundDevolutionEmitter,
      );

    const controllerRefundEventEmitter = new PixRefundEventEmitterController(
      eventRefundEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      refundDevolutionRepository,
      refundRepository,
      pixInfractionRefundOperationRepository,
      operationService,
      pixRefundGateway,
      controllerRefundEventEmitter,
      controllerRefundDevolutionEventEmitter,
    );
  }

  async execute(
    request: HandleCompletePixRefundDevolutionEventRequest,
  ): Promise<HandleCompletePixRefundDevolutionEventResponse> {
    this.logger.debug('Handle complete event by ID request.', { request });

    const { id, endToEndId } = request;

    const devolution = await this.usecase.execute(id, endToEndId);

    if (!devolution) return null;

    const response = new HandleCompletePixRefundDevolutionEventResponse({
      id: devolution.id,
      state: devolution.state,
      createdAt: devolution.createdAt,
    });

    this.logger.info('Handle complete event by ID response.', {
      devolution: response,
    });

    return response;
  }
}
