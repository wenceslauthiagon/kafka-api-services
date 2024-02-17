import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixDepositRepository,
  WarningPixDepositRepository,
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import { User, UserEntity } from '@zro/users/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { CreateWarningPixDevolutionUseCase as UseCase } from '@zro/pix-payments/application';
import {
  WarningPixDevolutionEventEmitterController,
  WarningPixDevolutionEventEmitterControllerInterface,
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type OperationId = Operation['id'];

type TCreateWarningPixDevolutionRequest = {
  userId: UserId;
  operationId: OperationId;
};

export class CreateWarningPixDevolutionRequest
  extends AutoValidator
  implements TCreateWarningPixDevolutionRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TCreateWarningPixDevolutionRequest) {
    super(props);
  }
}

type TCreateWarningPixDevolutionResponse = Pick<
  WarningPixDevolution,
  'id' | 'state'
>;

export class CreateWarningPixDevolutionResponse
  extends AutoValidator
  implements TCreateWarningPixDevolutionResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  constructor(props: TCreateWarningPixDevolutionResponse) {
    super(props);
  }
}

export class CreateWarningPixDevolutionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    depositRepository: PixDepositRepository,
    warningPixDepositRepository: WarningPixDepositRepository,
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateWarningPixDevolutionController.name,
    });

    const controllePixDepositEventEmitter =
      new PixDepositEventEmitterController(pixDepositEventEmitter);

    const controllerWarningPixDevolutionEventEmitter =
      new WarningPixDevolutionEventEmitterController(
        warningPixDevolutionEventEmitter,
      );

    this.usecase = new UseCase(
      this.logger,
      depositRepository,
      warningPixDepositRepository,
      warningPixDevolutionRepository,
      controllePixDepositEventEmitter,
      controllerWarningPixDevolutionEventEmitter,
    );
  }

  async execute(
    request: CreateWarningPixDevolutionRequest,
  ): Promise<CreateWarningPixDevolutionResponse> {
    this.logger.debug('Create warning pix deposit request.', { request });

    const { userId, operationId } = request;

    const operation = new OperationEntity({ id: operationId });

    const user = new UserEntity({ uuid: userId });

    const pixWarningDevolution = await this.usecase.execute(user, operation);

    if (!pixWarningDevolution) return null;

    const response = new CreateWarningPixDevolutionResponse({
      id: pixWarningDevolution.id,
      state: pixWarningDevolution.state,
    });

    this.logger.info('Pix warning devolution response.', {
      pixWarningDevolution: response,
    });

    return response;
  }
}
