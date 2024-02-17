import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  PixDeposit,
  PixDepositRepository,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import { GetPixDevolutionByOperationIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type TGetPixDevolutionByOperationIdRequest = {
  userId?: UserId;
  walletId?: WalletId;
  operationId: OperationId;
};

export class GetPixDevolutionByOperationIdRequest
  extends AutoValidator
  implements TGetPixDevolutionByOperationIdRequest
{
  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TGetPixDevolutionByOperationIdRequest) {
    super(props);
  }
}

type TGetPixDevolutionByOperationIdResponse = Pick<
  PixDevolution,
  'id' | 'amount' | 'description' | 'state' | 'createdAt' | 'failed' | 'deposit'
> & { userId: UserId; operationId: OperationId };

export class GetPixDevolutionByOperationIdResponse
  extends AutoValidator
  implements TGetPixDevolutionByOperationIdResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsUUID(4)
  operationId: OperationId;

  @IsObject()
  deposit: PixDeposit;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;
  constructor(props: TGetPixDevolutionByOperationIdResponse) {
    super(props);
  }
}

export class GetPixDevolutionByOperationIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    devolutionRepository: PixDevolutionRepository,
    depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({
      context: GetPixDevolutionByOperationIdController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      devolutionRepository,
      depositRepository,
    );
  }

  async execute(
    request: GetPixDevolutionByOperationIdRequest,
  ): Promise<GetPixDevolutionByOperationIdResponse> {
    this.logger.debug('Get devolution by operation id request.', { request });
    const { operationId, userId, walletId } = request;

    const wallet = walletId && new WalletEntity({ uuid: walletId });
    const user = userId && new UserEntity({ uuid: userId });
    const operation = new OperationEntity({ id: operationId });

    const devolution = await this.usecase.execute(operation, user, wallet);

    if (!devolution) return null;

    const response = new GetPixDevolutionByOperationIdResponse({
      id: devolution.id,
      userId: devolution.user.uuid,
      amount: devolution.amount,
      description: devolution.description,
      failed: devolution.failed,
      state: devolution.state,
      operationId: devolution.operation.id,
      deposit: devolution.deposit,
      createdAt: devolution.createdAt,
    });

    this.logger.info('Get deposit by operation id response.', {
      deposit: response,
    });

    return response;
  }
}
