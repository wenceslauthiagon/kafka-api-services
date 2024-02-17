import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixRefund,
  PixRefundRepository,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixRefundState,
} from '@zro/pix-payments/domain';
import {
  HandleReceivePendingPixRefundUseCase as UseCase,
  PixRefundEvent,
  IssueRefundGateway,
} from '@zro/pix-payments/application';
import {
  PixRefundEventEmitterController,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleReceivePendingPixRefundRequest = PixRefundEvent;

export class HandleReceivePendingPixRefundRequest
  extends AutoValidator
  implements THandleReceivePendingPixRefundRequest
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixRefundState)
  state: PixRefundState;

  constructor(props: THandleReceivePendingPixRefundRequest) {
    super(props);
  }
}

type THandleReceivePendingPixRefundResponse = Pick<PixRefund, 'id' | 'state'>;

export class HandleReceivePendingPixRefundResponse
  extends AutoValidator
  implements THandleReceivePendingPixRefundResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixRefundState)
  state!: PixRefundState;

  constructor(props: THandleReceivePendingPixRefundResponse) {
    super(props);
  }
}

export class HandleReceivePendingPixRefundController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    repository: PixRefundRepository,
    depositRepository: PixDepositRepository,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    infractionGateway: IssueRefundGateway,
    infractionEventEmitter: PixRefundEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleReceivePendingPixRefundController.name,
    });

    const controllerEventEmitter = new PixRefundEventEmitterController(
      infractionEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      repository,
      depositRepository,
      devolutionReceivedRepository,
      infractionGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleReceivePendingPixRefundRequest,
  ): Promise<HandleReceivePendingPixRefundResponse> {
    this.logger.debug('Create handle receive infraction request.', { request });

    const { id } = request;

    const receivePixRefund = await this.usecase.execute(id);

    if (!receivePixRefund) return null;

    const response = new HandleReceivePendingPixRefundResponse({
      id: receivePixRefund.id,
      state: receivePixRefund.state,
    });

    this.logger.info('Receive infraction response.', {
      receivePixRefund: response,
    });

    return response;
  }
}
