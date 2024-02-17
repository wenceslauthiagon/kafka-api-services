import { Logger } from 'winston';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  ReceivePixDevolutionChargebackUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PixDevolutionEventEmitterController,
  PixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type TReceivePixDevolutionChargebackRequest = Pick<
  PixDevolution,
  'id' | 'chargebackReason' | 'failed'
>;

export class ReceivePixDevolutionChargebackRequest
  extends AutoValidator
  implements TReceivePixDevolutionChargebackRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  chargebackReason?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  constructor(props: TReceivePixDevolutionChargebackRequest) {
    super(props);
  }
}

type TReceivePixDevolutionChargebackResponse = Pick<
  PixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class ReceivePixDevolutionChargebackResponse
  extends AutoValidator
  implements TReceivePixDevolutionChargebackResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TReceivePixDevolutionChargebackResponse) {
    super(props);
  }
}

export class ReceivePixDevolutionChargebackController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    devolutionRepository: PixDevolutionRepository,
    depositRepository: PixDepositRepository,
    eventEmitter: PixDevolutionEventEmitterControllerInterface,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: ReceivePixDevolutionChargebackController.name,
    });

    const controllerEventEmitter = new PixDevolutionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      devolutionRepository,
      depositRepository,
      controllerEventEmitter,
      operationService,
    );
  }

  async execute(
    request: ReceivePixDevolutionChargebackRequest,
  ): Promise<ReceivePixDevolutionChargebackResponse> {
    this.logger.debug('Receive PixDevolution chargeback request.', { request });

    const { id, chargebackReason, failed } = request;

    const devolution = await this.usecase.execute(id, chargebackReason, failed);

    if (!devolution) return null;

    const response = new ReceivePixDevolutionChargebackResponse({
      id: devolution.id,
      state: devolution.state,
      createdAt: devolution.createdAt,
    });

    this.logger.info('Receive PixDevolution chargeback response.', {
      devolutionReceived: response,
    });

    return response;
  }
}
