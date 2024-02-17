import { Logger } from 'winston';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  ApprovePixDepositUseCase as UseCase,
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
} from '@zro/pix-payments/interface';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { IsDate, IsEnum, IsObject, IsUUID } from 'class-validator';
import { User } from '@zro/users/domain';

type OperationId = Operation['id'];

type TApprovePixDepositRequest = {
  operationId: OperationId;
};

export class ApprovePixDepositRequest
  extends AutoValidator
  implements TApprovePixDepositRequest
{
  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TApprovePixDepositRequest) {
    super(props);
  }
}

type TApprovePixDepositResponse = Pick<
  PixDeposit,
  'user' | 'operation' | 'state' | 'createdAt' | 'updatedAt'
>;

export class ApprovePixDepositResponse
  extends AutoValidator
  implements TApprovePixDepositResponse
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

  constructor(props: TApprovePixDepositResponse) {
    super(props);
  }
}

export class ApprovePixDepositController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private readonly depositRepository: PixDepositRepository,
    private readonly warningPixDepositRepository: WarningPixDepositRepository,
    private readonly operationService: OperationService,
    private readonly eventEmitter: PixDepositEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ApprovePixDepositController.name,
    });

    const controllerEventEmitter = new PixDepositEventEmitterController(
      this.eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      this.depositRepository,
      this.warningPixDepositRepository,
      this.operationService,
      controllerEventEmitter,
    );
  }

  async execute(
    request: ApprovePixDepositRequest,
  ): Promise<ApprovePixDepositResponse> {
    this.logger.debug('Approve pix deposit request.', { request });

    const { operationId } = request;

    const operation = new OperationEntity({ id: operationId });
    const pixDepositParams = new PixDepositEntity({ operation });

    const pixDeposit = await this.usecase.execute(pixDepositParams);

    if (!pixDeposit) return null;

    const response = new ApprovePixDepositResponse({
      user: pixDeposit.user,
      operation: pixDeposit.operation,
      state: pixDeposit.state,
      createdAt: pixDeposit.createdAt,
      updatedAt: pixDeposit.updatedAt,
    });

    this.logger.info('Pix deposit approved response.', {
      pixDeposit: response,
    });

    return response;
  }
}
