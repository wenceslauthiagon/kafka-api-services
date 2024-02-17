import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  HandlePendingWarningPixDevolutionEventUseCase as UseCase,
  WarningPixDevolutionEvent,
  PixPaymentGateway,
  OperationService,
  ComplianceService,
  IssueWarningTransactionGateway,
} from '@zro/pix-payments/application';
import {
  PixDepositRepository,
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  WarningPixDevolutionEventEmitterController,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type THandlePendingWarningPixDevolutionEventRequest = Pick<
  WarningPixDevolutionEvent,
  'id' | 'state'
> & { userId: UserId };

export class HandlePendingWarningPixDevolutionEventRequest
  extends AutoValidator
  implements THandlePendingWarningPixDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  @IsUUID(4)
  userId: UserId;

  constructor(props: THandlePendingWarningPixDevolutionEventRequest) {
    super(props);
  }
}

type THandlePendingWarningPixDevolutionEventResponse = Pick<
  WarningPixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingWarningPixDevolutionEventResponse
  extends AutoValidator
  implements THandlePendingWarningPixDevolutionEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(WarningPixDevolutionState)
  state!: WarningPixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingWarningPixDevolutionEventResponse) {
    super(props);
  }
}

export class HandlePendingWarningPixDevolutionEventController {
  /**
   * Handler triggered when devolution was added successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param warningPixDevolutionRepository WarningPixDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param eventEmitter PixDevolution event emitter.
   * @param pspGateway PixDevolution psp gateway.
   * @param issueWarningTransactionGateway Issue Warning Transaction Gateway.
   * @param operationService Operation service.
   * @param complianceService Compliance service.
   */
  constructor(
    private logger: Logger,
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    depositRepository: PixDepositRepository,
    eventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
    issueWarningTransactionGateway: IssueWarningTransactionGateway,
    operationService: OperationService,
    complianceService: ComplianceService,
    messageUserRequestWarningPixDevolution: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingWarningPixDevolutionEventController.name,
    });

    const controllerEventEmitter =
      new WarningPixDevolutionEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      warningPixDevolutionRepository,
      depositRepository,
      pspGateway,
      issueWarningTransactionGateway,
      operationService,
      complianceService,
      controllerEventEmitter,
      messageUserRequestWarningPixDevolution,
    );
  }

  async execute(
    request: HandlePendingWarningPixDevolutionEventRequest,
  ): Promise<HandlePendingWarningPixDevolutionEventResponse> {
    this.logger.debug(
      'Handle pending warning pix devolution event by ID request.',
      { request },
    );

    const { id } = request;

    const warningPixDevolution = await this.usecase.execute(id);

    if (!warningPixDevolution) return null;

    const response = new HandlePendingWarningPixDevolutionEventResponse({
      id: warningPixDevolution.id,
      state: warningPixDevolution.state,
      createdAt: warningPixDevolution.createdAt,
    });

    this.logger.info(
      'Handle pending warningPixDevolution event by ID response.',
      { refundDevolution: response },
    );

    return response;
  }
}
