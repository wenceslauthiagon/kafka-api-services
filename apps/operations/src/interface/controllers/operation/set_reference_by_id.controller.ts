import { Logger } from 'winston';
import {
  Operation,
  OperationRepository,
  OperationState,
} from '@zro/operations/domain';
import { SetOperationReferenceByIdUseCase as UseCase } from '@zro/operations/application';
import { AutoValidator } from '@zro/common';
import { IsEnum, IsUUID, ValidateNested } from 'class-validator';

type TSetOperationReferenceByIdRequest = {
  operationIdFirst: Operation['id'];
  operationIdSecond: Operation['id'];
};

export class SetOperationReferenceByIdRequest
  extends AutoValidator
  implements TSetOperationReferenceByIdRequest
{
  @IsUUID(4)
  operationIdFirst: string;

  @IsUUID(4)
  operationIdSecond: string;

  constructor(props: TSetOperationReferenceByIdRequest) {
    super(props);
  }
}

type TOperationResponse = Pick<Operation, 'id' | 'state'> & {
  operationRefId: Operation['id'];
};

class OperationResponse extends AutoValidator implements TOperationResponse {
  @IsUUID(4)
  id: string;

  @IsEnum(OperationState)
  state: OperationState;

  @IsUUID(4)
  operationRefId: string;

  constructor(props: TOperationResponse) {
    super(props);
  }
}

type TSetOperationReferenceByIdResponse = {
  operationFirst: TOperationResponse;
  operationSecond: TOperationResponse;
};

export class SetOperationReferenceByIdResponse
  extends AutoValidator
  implements TSetOperationReferenceByIdResponse
{
  @ValidateNested()
  operationFirst: OperationResponse;

  @ValidateNested()
  operationSecond: OperationResponse;

  constructor(props: TSetOperationReferenceByIdResponse) {
    super(
      Object.assign({}, props, {
        operationFirst: new OperationResponse(props.operationFirst),
        operationSecond: new OperationResponse(props.operationSecond),
      }),
    );
  }
}

export class SetOperationReferenceByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
  ) {
    this.logger = logger.child({
      context: SetOperationReferenceByIdController.name,
    });

    this.usecase = new UseCase(this.logger, operationRepository);
  }

  async execute(
    request: SetOperationReferenceByIdRequest,
  ): Promise<SetOperationReferenceByIdResponse> {
    this.logger.debug('Set reference by operation id.', { request });

    const { operationIdFirst, operationIdSecond } = request;

    const result = await this.usecase.execute(
      operationIdFirst,
      operationIdSecond,
    );

    const response: SetOperationReferenceByIdResponse =
      this.setOperationReferenceByIdPresenter(
        result.operationFirst,
        result.operationSecond,
      );

    this.logger.debug('Set reference by operation id response.', { response });

    return response;
  }

  /**
   * Create an DTO for an operation.
   *
   * @param operation Operation.
   * @returns Operation DTO.
   */
  private operationPresenter(operation: Operation): OperationResponse {
    if (!operation) return null;

    return new OperationResponse({
      id: operation.id,
      state: operation.state,
      operationRefId: operation.operationRef.id,
    });
  }

  private setOperationReferenceByIdPresenter(
    operationFirst: Operation,
    operationSecond: Operation,
  ): SetOperationReferenceByIdResponse {
    return new SetOperationReferenceByIdResponse({
      operationFirst: this.operationPresenter(operationFirst),
      operationSecond: this.operationPresenter(operationSecond),
    });
  }
}
