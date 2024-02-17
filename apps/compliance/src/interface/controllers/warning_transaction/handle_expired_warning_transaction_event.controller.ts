import { Logger } from 'winston';
import {
  IsEnum,
  IsUUID,
  IsDate,
  IsObject,
  IsString,
  IsInt,
  IsPositive,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { Operation } from '@zro/operations/domain';
import {
  HandleExpiredWarningTransactionEventUseCase as UseCase,
  WarningTransactionGateway,
} from '@zro/compliance/application';
import {
  WarningTransactionEventEmitterController,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';

export type THandleExpiredWarningTransactionEventRequest = Pick<
  WarningTransaction,
  'id' | 'status'
>;

export class HandleExpiredWarningTransactionEventRequest
  extends AutoValidator
  implements THandleExpiredWarningTransactionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningTransactionStatus)
  status: WarningTransactionStatus;

  constructor(props: THandleExpiredWarningTransactionEventRequest) {
    super(props);
  }
}

type THandleExpiredWarningTransactionEventResponse = Pick<
  WarningTransaction,
  | 'id'
  | 'operation'
  | 'transactionTag'
  | 'status'
  | 'issueId'
  | 'createdAt'
  | 'updatedAt'
>;

export class HandleExpiredWarningTransactionEventResponse
  extends AutoValidator
  implements THandleExpiredWarningTransactionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsObject()
  operation: Operation;

  @IsString()
  transactionTag: string;

  @IsEnum(WarningTransactionStatus)
  status: WarningTransactionStatus;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsDate()
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  @IsDate()
  updatedAt: Date;

  constructor(props: THandleExpiredWarningTransactionEventResponse) {
    super(props);
  }
}

export class HandleExpiredWarningTransactionEventController {
  /**
   * Handler triggered when Warning transaction expired.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param warningTransactionRepository Warning transaction repository.
   * @param warningTransactionGateway Warning transaction gateway.
   */
  constructor(
    private logger: Logger,
    warningTransactionRepository: WarningTransactionRepository,
    warningTransactionGateway: WarningTransactionGateway,
    eventEmitter: WarningTransactionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleExpiredWarningTransactionEventController.name,
    });

    const controllerEventEmitter = new WarningTransactionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      warningTransactionRepository,
      warningTransactionGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleExpiredWarningTransactionEventRequest,
  ): Promise<HandleExpiredWarningTransactionEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id } = request;

    const warningTransaction = await this.usecase.execute(id);

    if (!warningTransaction) return null;

    const response = new HandleExpiredWarningTransactionEventResponse({
      id: warningTransaction.id,
      operation: warningTransaction.operation,
      transactionTag: warningTransaction.transactionTag,
      status: warningTransaction.status,
      issueId: warningTransaction.issueId,
      createdAt: warningTransaction.createdAt,
      updatedAt: warningTransaction.updatedAt,
    });

    this.logger.info('Handle expired warning transaction response.', {
      warningTransaction: response,
    });

    return response;
  }
}
