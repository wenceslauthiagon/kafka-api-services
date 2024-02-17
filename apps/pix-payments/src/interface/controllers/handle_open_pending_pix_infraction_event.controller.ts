import { Logger } from 'winston';
import { IsEnum, IsUUID, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfraction,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionRepository,
  PaymentRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  HandleOpenPendingPixInfractionEventUseCase as UseCase,
  PixInfractionEvent,
  PixInfractionGateway,
  IssueInfractionGateway,
} from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleOpenPendingPixInfractionEventRequest = PixInfractionEvent;

export class HandleOpenPendingPixInfractionEventRequest
  extends AutoValidator
  implements THandleOpenPendingPixInfractionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: THandleOpenPendingPixInfractionEventRequest) {
    super(props);
  }
}

type THandleOpenPendingPixInfractionEventResponse = Pick<
  PixInfraction,
  'id' | 'issueId' | 'state' | 'status'
>;

export class HandleOpenPendingPixInfractionEventResponse
  extends AutoValidator
  implements THandleOpenPendingPixInfractionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  constructor(props: THandleOpenPendingPixInfractionEventResponse) {
    super(props);
  }
}

export class HandleOpenPendingPixInfractionEventController {
  /**
   * Handler triggered when Infraction was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pspGateway Pix payment gateway.
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    pspGateway: PixInfractionGateway,
    issueInfractionGateway: IssueInfractionGateway,
    infractionRepository: PixInfractionRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    paymentRepository: PaymentRepository,
    devolutionRepository: PixDevolutionRepository,
  ) {
    this.logger = logger.child({
      context: HandleOpenPendingPixInfractionEventController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      infractionRepository,
      pspGateway,
      issueInfractionGateway,
      controllerEventEmitter,
      paymentRepository,
      devolutionRepository,
    );
  }

  async execute(
    request: HandleOpenPendingPixInfractionEventRequest,
  ): Promise<HandleOpenPendingPixInfractionEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id } = request;

    const infractionUpdated = await this.usecase.execute(id);

    if (!infractionUpdated) return null;

    const response = new HandleOpenPendingPixInfractionEventResponse({
      id: infractionUpdated.id,
      issueId: infractionUpdated.issueId,
      state: infractionUpdated.state,
      status: infractionUpdated.status,
    });

    this.logger.info('Handle pending event by ID response.', {
      infraction: response,
    });

    return response;
  }
}
