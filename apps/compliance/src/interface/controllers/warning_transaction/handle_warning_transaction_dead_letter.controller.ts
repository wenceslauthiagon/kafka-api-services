import { Logger } from 'winston';
import { IsEnum, IsObject, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import {
  WarningTransaction,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { HandleWarningTransactionDeadLetterUseCase } from '@zro/compliance/application';
import {
  WarningTransactionEventEmitterController,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';

type THandleWarningTransactionDeadLetterEventRequest = Pick<
  WarningTransaction,
  'id' | 'status'
>;

/**
 * Warning transaction request DTO used to class validation.
 */
export class HandleWarningTransactionDeadLetterEventRequest
  extends AutoValidator
  implements THandleWarningTransactionDeadLetterEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningTransactionStatus)
  status: WarningTransactionStatus;

  constructor(props: THandleWarningTransactionDeadLetterEventRequest) {
    super(props);
  }
}

export type THandleWarningTransactionDeadLetterResponse = Pick<
  WarningTransaction,
  'id' | 'operation' | 'status'
>;

export class HandleWarningTransactionDeadLetterResponse
  extends AutoValidator
  implements THandleWarningTransactionDeadLetterResponse
{
  @IsUUID(4)
  id: string;

  @IsObject()
  operation: Operation;

  @IsEnum(WarningTransactionStatus)
  status: WarningTransactionStatus;

  constructor(props: THandleWarningTransactionDeadLetterResponse) {
    super(props);
  }
}

export class HandleWarningTransactionDeadLetterController {
  /**
   * Local logger instance.
   */
  private logger: Logger;

  /**
   * Send warning transaction use case.
   */
  private usecase: HandleWarningTransactionDeadLetterUseCase;

  /**
   * Warning transaction event used by use case.
   */
  private warningTransactionEventEmitter: WarningTransactionEventEmitterControllerInterface;

  /**
   * Default constructor.
   * @param {WarningTransactionRepository} warningTransactionRepository Warning transaction repository.
   * @param {WarningTransactionEventEmitterController} warningTransactionEventEmitterController Warning transaction event emitter.
   * @param {Logger} logger Global logger.
   * @returns HandleWarningTransactionDeadLetterResponse Warning transaction handle response.
   */
  constructor(
    private readonly warningTransactionRepository: WarningTransactionRepository,
    private readonly warningTransactionEventEmitterController: WarningTransactionEventEmitterControllerInterface,
    logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleWarningTransactionDeadLetterController.name,
    });

    const controllerEventEmitter = new WarningTransactionEventEmitterController(
      this.warningTransactionEventEmitterController,
    );

    this.usecase = new HandleWarningTransactionDeadLetterUseCase(
      this.warningTransactionRepository,
      controllerEventEmitter,
      this.logger,
    );
  }

  /**
   * Send ead letter warning transaction to Jira.
   * @param {HandleWarningTransactionDeadLetterRequest} request Warning transaction request params.
   * @returns {HandleWarningTransactionDeadLetterResponse} Sent warning transaction.
   */
  async execute(
    request: HandleWarningTransactionDeadLetterEventRequest,
  ): Promise<HandleWarningTransactionDeadLetterResponse> {
    // Send warning transaction to Jira.
    const warningTransaction = await this.usecase.execute(request.id);

    if (!warningTransaction) return null;

    const response: HandleWarningTransactionDeadLetterResponse = {
      id: warningTransaction.id,
      operation: warningTransaction.operation,
      status: warningTransaction.status,
    };

    return response;
  }
}
