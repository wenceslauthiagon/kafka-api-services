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
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import { User, UserEntity } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import { GetWarningPixDevolutionByIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type OperationId = Operation['id'];

type TGetWarningPixDevolutionByIdRequest = {
  userId?: UserId;
};

export class GetWarningPixDevolutionByIdRequest
  extends AutoValidator
  implements TGetWarningPixDevolutionByIdRequest
{
  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  id: string;

  constructor(props: TGetWarningPixDevolutionByIdRequest) {
    super(props);
  }
}

type TGetWarningPixDevolutionByIdResponse = Pick<
  WarningPixDevolution,
  'id' | 'amount' | 'description' | 'state' | 'createdAt'
> & { userId: UserId; operationId: OperationId };

export class GetWarningPixDevolutionByIdResponse
  extends AutoValidator
  implements TGetWarningPixDevolutionByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  operationId: OperationId;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;
  constructor(props: TGetWarningPixDevolutionByIdResponse) {
    super(props);
  }
}

export class GetWarningPixDevolutionIdController {
  private useCase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: WarningPixDevolutionRepository,
  ) {
    this.logger = logger.child({
      context: GetWarningPixDevolutionIdController.name,
    });

    this.useCase = new UseCase(this.logger, paymentRepository);
  }

  async execute(
    request: GetWarningPixDevolutionByIdRequest,
  ): Promise<GetWarningPixDevolutionByIdResponse> {
    this.logger.debug('Get warning devolution by id.', { request });
    const { id, userId } = request;

    const user = userId && new UserEntity({ uuid: userId });

    const warningDevolution = await this.useCase.execute(id, user);

    if (!warningDevolution) return null;

    const response = new GetWarningPixDevolutionByIdResponse({
      id: warningDevolution.id,
      amount: warningDevolution.amount,
      createdAt: warningDevolution.createdAt,
      operationId: warningDevolution.operation.id,
      state: warningDevolution.state,
      userId: warningDevolution.user.uuid,
      description: warningDevolution.description,
    });

    this.logger.info('Get warning warningDevolution by id response', {
      warningDevolution: response,
    });

    return response;
  }
}
