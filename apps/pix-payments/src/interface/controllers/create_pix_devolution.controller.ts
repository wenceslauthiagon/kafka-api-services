import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  MaxValue,
  SanitizeHtml,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  PixDepositRepository,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import { CreatePixDevolutionUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixDevolutionEventEmitterController,
  PixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type TCreatePixDevolutionRequest = Pick<
  PixDevolution,
  'id' | 'amount' | 'description'
> & { userId: UserId; walletId: WalletId; operationId: OperationId };

export class CreatePixDevolutionRequest
  extends AutoValidator
  implements TCreatePixDevolutionRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId!: WalletId;

  @IsUUID(4)
  operationId: OperationId;

  @IsInt()
  @IsPositive()
  @MaxValue(1e18)
  amount: number;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;

  constructor(props: TCreatePixDevolutionRequest) {
    super(props);
  }
}

type TCreatePixDevolutionResponse = Pick<
  PixDevolution,
  'id' | 'amount' | 'description' | 'state' | 'createdAt' | 'endToEndId'
>;

export class CreatePixDevolutionResponse
  extends AutoValidator
  implements TCreatePixDevolutionResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreatePixDevolutionResponse) {
    super(props);
  }
}

export class CreatePixDevolutionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    devolutionRepository: PixDevolutionRepository,
    depositRepository: PixDepositRepository,
    eventEmitter: PixDevolutionEventEmitterControllerInterface,
    pixPaymentDevolutionMaxNumber: number,
    depositDevolutionIntervalDays: number,
    staticWithdrawalTransactionTag: string,
    dinamicWithdrawalTransactionTag: string,
    dinamicChangeTransactionTag: string,
  ) {
    this.logger = logger.child({ context: CreatePixDevolutionController.name });

    const controllerEventEmitter = new PixDevolutionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      devolutionRepository,
      depositRepository,
      controllerEventEmitter,
      pixPaymentDevolutionMaxNumber,
      depositDevolutionIntervalDays,
      staticWithdrawalTransactionTag,
      dinamicWithdrawalTransactionTag,
      dinamicChangeTransactionTag,
    );
  }

  async execute(
    request: CreatePixDevolutionRequest,
  ): Promise<CreatePixDevolutionResponse> {
    this.logger.debug('Create Pix Devolution request.', { request });

    const { id, userId, walletId, operationId, amount, description } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });
    const operation = new OperationEntity({ id: operationId });

    const devolution = await this.usecase.execute(
      id,
      user,
      wallet,
      operation,
      amount,
      description,
    );

    if (!devolution) return null;

    const response = new CreatePixDevolutionResponse({
      id: devolution.id,
      state: devolution.state,
      amount: devolution.amount,
      description: devolution.description,
      createdAt: devolution.createdAt,
    });

    this.logger.info('Create Pix Devolution response.', {
      devolution: response,
    });

    return response;
  }
}
