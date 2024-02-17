import { Logger } from 'winston';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  PixDepositRepository,
  PixInfractionRefundOperationRepository,
  PixRefundDevolution,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import {
  HandleRevertPixRefundDevolutionEventUseCase as UseCase,
  OperationService,
  PixRefundDevolutionEvent,
} from '@zro/pix-payments/application';
import {
  PixRefundDevolutionEventEmitterController,
  PixRefundDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type THandleRevertPixRefundDevolutionEventRequest = Pick<
  PixRefundDevolutionEvent,
  'id' | 'state' | 'chargebackReason' | 'failed'
> & { userId: UserId };

export class HandleRevertPixRefundDevolutionEventRequest
  extends AutoValidator
  implements THandleRevertPixRefundDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundDevolutionState)
  state: PixRefundDevolutionState;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  chargebackReason?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  constructor(props: THandleRevertPixRefundDevolutionEventRequest) {
    super(props);
  }
}

type THandleRevertPixRefundDevolutionEventResponse = Pick<
  PixRefundDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandleRevertPixRefundDevolutionEventResponse
  extends AutoValidator
  implements THandleRevertPixRefundDevolutionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundDevolutionState)
  state: PixRefundDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleRevertPixRefundDevolutionEventResponse) {
    super(props);
  }
}

export class HandleRevertPixRefundDevolutionEventController {
  /**
   * Handler triggered when an revert is thrown.
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
    devolutionRepository: PixRefundDevolutionRepository,
    depositRepository: PixDepositRepository,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    pixRefundRepository: PixRefundRepository,
    eventEmitter: PixRefundDevolutionEventEmitterControllerInterface,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandleRevertPixRefundDevolutionEventController.name,
    });

    const controllerEventEmitter =
      new PixRefundDevolutionEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      devolutionRepository,
      depositRepository,
      pixInfractionRefundOperationRepository,
      pixRefundRepository,
      controllerEventEmitter,
      operationService,
    );
  }

  async execute(
    request: HandleRevertPixRefundDevolutionEventRequest,
  ): Promise<HandleRevertPixRefundDevolutionEventResponse> {
    this.logger.debug('Handle revert event by ID request.', { request });

    const { id, chargebackReason, failed } = request;

    const devolution = await this.usecase.execute(id, chargebackReason, failed);

    if (!devolution) return null;

    const response = new HandleRevertPixRefundDevolutionEventResponse({
      id: devolution.id,
      state: devolution.state,
      createdAt: devolution.createdAt,
    });

    this.logger.info('Handle revert event by ID response.', {
      devolution: response,
    });

    return response;
  }
}
