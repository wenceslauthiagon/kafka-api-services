import { Logger } from 'winston';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  BlockPixDepositUseCase as UseCase,
  OperationService,
} from '@zro/pix-payments/application';
import {
  PixDeposit,
  PixDepositEntity,
  PixDepositRepository,
  PixDepositState,
  WarningPixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
  WarningPixDevolutionEventEmitterControllerInterface,
  WarningPixDevolutionEventEmitterController,
} from '@zro/pix-payments/interface';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { IsDate, IsEnum, IsObject, IsUUID } from 'class-validator';
import { User } from '@zro/users/domain';

type OperationId = Operation['id'];

type TBlockPixDepositRequest = {
  operationId: OperationId;
};

export class BlockPixDepositRequest
  extends AutoValidator
  implements TBlockPixDepositRequest
{
  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TBlockPixDepositRequest) {
    super(props);
  }
}

type TBlockPixDepositResponse = Pick<
  PixDeposit,
  'user' | 'operation' | 'state' | 'createdAt' | 'updatedAt'
>;

export class BlockPixDepositResponse
  extends AutoValidator
  implements TBlockPixDepositResponse
{
  @IsObject()
  user: User;

  @IsObject()
  operation: Operation;

  @IsEnum(PixDepositState)
  state: PixDepositState;

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

  constructor(props: TBlockPixDepositResponse) {
    super(props);
  }
}

export class BlockPixDepositController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private readonly depositRepository: PixDepositRepository,
    private readonly warningPixDepositRepository: WarningPixDepositRepository,
    private readonly operationService: OperationService,
    private readonly pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    private readonly warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: BlockPixDepositController.name,
    });

    const controllerPixDepositEventEmitter =
      new PixDepositEventEmitterController(this.pixDepositEventEmitter);

    const controllerWarningPixDevolutionEventEmitter =
      new WarningPixDevolutionEventEmitterController(
        this.warningPixDevolutionEventEmitter,
      );

    this.usecase = new UseCase(
      this.logger,
      this.depositRepository,
      this.warningPixDepositRepository,
      this.operationService,
      controllerPixDepositEventEmitter,
      controllerWarningPixDevolutionEventEmitter,
    );
  }

  async execute(
    request: BlockPixDepositRequest,
  ): Promise<BlockPixDepositResponse> {
    this.logger.debug('Block pix deposit request.', { request });

    const { operationId } = request;

    const operation = new OperationEntity({ id: operationId });
    const pixDepositParams = new PixDepositEntity({ operation });

    const pixDeposit = await this.usecase.execute(pixDepositParams);

    if (!pixDeposit) return null;

    const response = new BlockPixDepositResponse({
      user: pixDeposit.user,
      operation: pixDeposit.operation,
      state: pixDeposit.state,
      createdAt: pixDeposit.createdAt,
      updatedAt: pixDeposit.updatedAt,
    });

    this.logger.info('Pix deposit blocked response.', {
      pixDeposit: response,
    });

    return response;
  }
}
