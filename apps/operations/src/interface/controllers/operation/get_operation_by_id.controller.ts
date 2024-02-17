import { Logger } from 'winston';
import { IsEnum, IsInt, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  Operation,
  OperationRepository,
  OperationState,
} from '@zro/operations/domain';
import { GetOperationByIdUseCase as UseCase } from '@zro/operations/application';

type TGetOperationByIdRequest = Pick<Operation, 'id'>;

export class GetOperationByIdRequest
  extends AutoValidator
  implements TGetOperationByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: GetOperationByIdRequest) {
    super(props);
  }
}

type TGetOperationByIdResponse = Pick<
  Operation,
  'id' | 'state' | 'value' | 'createdAt'
>;

export class GetOperationByIdResponse
  extends AutoValidator
  implements TGetOperationByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(OperationState)
  state: OperationState;

  @IsInt()
  value: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetOperationByIdResponse) {
    super(props);
  }
}

export class GetOperationByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
  ) {
    this.logger = logger.child({ context: GetOperationByIdController.name });

    this.usecase = new UseCase(this.logger, operationRepository);
  }

  async execute(
    request: GetOperationByIdRequest,
  ): Promise<GetOperationByIdResponse> {
    this.logger.debug('Get by operation id.', { request });

    const { id } = request;

    const operation = await this.usecase.execute(id);

    if (!operation) return null;

    return new GetOperationByIdResponse({
      id: operation.id,
      value: operation.value,
      state: operation.state,
      createdAt: operation.createdAt,
    });
  }
}
