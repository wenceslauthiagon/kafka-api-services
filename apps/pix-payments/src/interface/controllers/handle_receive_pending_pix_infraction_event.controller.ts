import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import {
  HandleReceivePendingPixInfractionEventUseCase as UseCase,
  PixInfractionEvent,
  IssueInfractionGateway,
} from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleReceivePendingPixInfractionRequest = PixInfractionEvent;

export class HandleReceivePendingPixInfractionRequest
  extends AutoValidator
  implements THandleReceivePendingPixInfractionRequest
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: THandleReceivePendingPixInfractionRequest) {
    super(props);
  }
}

type THandleReceivePendingPixInfractionResponse = Pick<
  PixInfraction,
  'id' | 'state'
>;

export class HandleReceivePendingPixInfractionResponse
  extends AutoValidator
  implements THandleReceivePendingPixInfractionResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixInfractionState)
  state!: PixInfractionState;

  constructor(props: THandleReceivePendingPixInfractionResponse) {
    super(props);
  }
}

export class HandleReceivePendingPixInfractionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    depositRepository: PixDepositRepository,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    infractionGateway: IssueInfractionGateway,
    infractionEventEmitter: PixInfractionEventEmitterControllerInterface,
    infractionDueDate: string,
  ) {
    this.logger = logger.child({
      context: HandleReceivePendingPixInfractionController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      infractionEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      infractionGateway,
      controllerEventEmitter,
      infractionDueDate,
    );
  }

  async execute(
    request: HandleReceivePendingPixInfractionRequest,
  ): Promise<HandleReceivePendingPixInfractionResponse> {
    this.logger.debug('Create handle receive infraction request.', { request });

    const { id } = request;

    const receiveInfraction = await this.usecase.execute(id);

    if (!receiveInfraction) return null;

    const response = new HandleReceivePendingPixInfractionResponse({
      id: receiveInfraction.id,
      state: receiveInfraction.state,
    });

    this.logger.info('Receive infraction response.', {
      receiveInfraction: response,
    });

    return response;
  }
}
