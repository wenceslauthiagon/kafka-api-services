import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import {
  HandleRegisterPendingPixFraudDetectionEventUseCase as UseCase,
  PixFraudDetectionGateway,
  IssuePixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  PixFraudDetectionEventEmitterController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleRegisterPendingPixFraudDetectionEventRequest = Pick<
  PixFraudDetection,
  'id'
>;

export class HandleRegisterPendingPixFraudDetectionEventRequest
  extends AutoValidator
  implements THandleRegisterPendingPixFraudDetectionEventRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: THandleRegisterPendingPixFraudDetectionEventRequest) {
    super(props);
  }
}

type THandleRegisterPendingPixFraudDetectionEventResponse = Pick<
  PixFraudDetection,
  'id' | 'state'
>;

export class HandleRegisterPendingPixFraudDetectionEventResponse
  extends AutoValidator
  implements THandleRegisterPendingPixFraudDetectionEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixFraudDetectionState)
  state!: PixFraudDetectionState;

  constructor(props: THandleRegisterPendingPixFraudDetectionEventResponse) {
    super(props);
  }
}

export class HandleRegisterPendingPixFraudDetectionEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixFraudDetectionRepository: PixFraudDetectionRepository,
    pixFraudDetectionGateway: PixFraudDetectionGateway,
    issuePixFraudDetectionGateway: IssuePixFraudDetectionGateway,
    pixFraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleRegisterPendingPixFraudDetectionEventController.name,
    });

    const controllerEventEmitter = new PixFraudDetectionEventEmitterController(
      pixFraudDetectionEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixFraudDetectionRepository,
      pixFraudDetectionGateway,
      issuePixFraudDetectionGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleRegisterPendingPixFraudDetectionEventRequest,
  ): Promise<HandleRegisterPendingPixFraudDetectionEventResponse> {
    this.logger.debug(
      'Handle register pending pix fraud detection event request.',
      { request },
    );

    const { id } = request;

    const updatedPixFraudDetection = await this.usecase.execute(id);

    if (!updatedPixFraudDetection) return null;

    const response = new HandleRegisterPendingPixFraudDetectionEventResponse({
      id: updatedPixFraudDetection.id,
      state: updatedPixFraudDetection.state,
    });

    this.logger.info(
      'Handle register pending pix fraud detection event response.',
      { response },
    );

    return response;
  }
}
