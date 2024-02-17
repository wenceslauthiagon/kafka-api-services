import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  Operation,
  OperationRepository,
  OperationState,
  TransactionType,
  WalletAccountRepository,
} from '@zro/operations/domain';
import { RevertOperationUseCase } from '@zro/operations/application';
import {
  OperationEventEmitterController,
  OperationEventEmitterControllerInterface,
} from '@zro/operations/interface';

type TRevertOperationRequest = {
  id: Operation['id'];
};

export class RevertOperationRequest
  extends AutoValidator
  implements TRevertOperationRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TRevertOperationRequest) {
    super(props);
  }
}

type TRevertOperationResponse = Pick<
  Operation,
  'id' | 'state' | 'rawValue' | 'fee' | 'value' | 'description' | 'createdAt'
> & {
  transactionId: TransactionType['id'];
  operationRefId?: Operation['id'];
};

export class RevertOperationResponse
  extends AutoValidator
  implements TRevertOperationResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(OperationState)
  state: OperationState;

  @IsInt()
  @Min(0)
  rawValue: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;

  @IsString()
  @MaxLength(140)
  description: string;

  @IsInt()
  @Min(0)
  value: number;

  @IsInt()
  @IsPositive()
  transactionId: number;

  @IsOptional()
  @IsUUID(4)
  operationRefId?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TRevertOperationResponse) {
    super(props);
  }
}

export class RevertOperationController {
  private usecase: RevertOperationUseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   */
  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
    walletAccountRepository: WalletAccountRepository,
    serviceEventEmitter: OperationEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: RevertOperationController.name });

    const eventEmitter = new OperationEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new RevertOperationUseCase(
      this.logger,
      operationRepository,
      walletAccountRepository,
      eventEmitter,
    );
  }

  async execute(
    request: RevertOperationRequest,
  ): Promise<RevertOperationResponse> {
    this.logger.debug('Revert by operation id.', { request });

    const reverted = await this.usecase.execute(request.id);

    if (!reverted) return null;

    const response = new RevertOperationResponse({
      id: reverted.id,
      state: reverted.state,
      transactionId: reverted.transactionType.id,
      rawValue: reverted.rawValue,
      fee: reverted.fee,
      value: reverted.value,
      description: reverted.description,
      operationRefId: reverted.operationRef?.id,
      createdAt: reverted.createdAt,
    });

    this.logger.info('Revert Operation response.', { response });

    return response;
  }
}
