import { IsEnum, IsObject, IsUUID } from 'class-validator';
import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { Operation } from '@zro/operations/domain';
import {
  HandleWarningTransactionCreatedUseCase,
  WarningTransactionGateway,
} from '@zro/compliance/application';
import {
  WarningTransactionEventEmitterController,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';

type THandleWarningTransactionCreatedEventRequest = Pick<
  WarningTransaction,
  'id' | 'status'
>;

/**
 * Warning transaction request DTO used to class validation.
 */
export class HandleWarningTransactionCreatedEventRequest
  extends AutoValidator
  implements THandleWarningTransactionCreatedEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningTransactionStatus)
  status: WarningTransactionStatus;

  constructor(props: THandleWarningTransactionCreatedEventRequest) {
    super(props);
  }
}

export type THandleWarningTransactionCreatedResponse = Pick<
  WarningTransaction,
  'id' | 'operation' | 'status'
>;

export class HandleWarningTransactionCreatedResponse
  extends AutoValidator
  implements THandleWarningTransactionCreatedResponse
{
  @IsUUID(4)
  id: string;

  @IsObject()
  operation: Operation;

  @IsEnum(WarningTransactionStatus)
  status: WarningTransactionStatus;

  constructor(props: THandleWarningTransactionCreatedResponse) {
    super(props);
  }
}

export class HandleWarningTransactionCreatedController {
  /**
   * Send warning transaction use case.
   */
  private usecase: HandleWarningTransactionCreatedUseCase;

  /**
   * Default constructor.
   * @param {WarningTransactionRepository} warningTransactionRepository Warning transaction repository.
   * @param {WarningTransactionEventEmitterControllerInterface} warningTransactionEventEmitterController Warning transaction event emitter.
   * @param {WarningTransactionGateway} jiraWarningTransactionGateway Warning transaction gateway.
   * @param {Logger} logger Global logger.
   * @returns HandleWarningTransactionCreatedResponse Warning transaction handle response.
   */
  constructor(
    private logger: Logger,
    private readonly warningTransactionRepository: WarningTransactionRepository,
    private readonly warningTransactionEventEmitterController: WarningTransactionEventEmitterControllerInterface,
    private readonly jiraWarningTransactionGateway: WarningTransactionGateway,
  ) {
    this.logger = logger.child({
      context: HandleWarningTransactionCreatedController.name,
    });

    const controllerEventEmitter = new WarningTransactionEventEmitterController(
      this.warningTransactionEventEmitterController,
    );

    this.usecase = new HandleWarningTransactionCreatedUseCase(
      this.warningTransactionRepository,
      controllerEventEmitter,
      this.jiraWarningTransactionGateway,
      this.logger,
    );
  }

  /**
   * Send created warning transaction to Jira.
   * @param {HandleWarningTransactionCreatedRequest} request Warning transaction request params.
   * @returns {HandleWarningTransactionCreatedResponse} Sent warning transaction.
   */
  async execute(
    request: HandleWarningTransactionCreatedEventRequest,
  ): Promise<HandleWarningTransactionCreatedResponse> {
    // Send warning transaction to Jira.
    const warningTransaction = await this.usecase.execute(request.id);

    if (!warningTransaction) return null;

    const response: HandleWarningTransactionCreatedResponse = {
      id: warningTransaction.id,
      operation: warningTransaction.operation,
      status: warningTransaction.status,
    };

    return response;
  }
}
