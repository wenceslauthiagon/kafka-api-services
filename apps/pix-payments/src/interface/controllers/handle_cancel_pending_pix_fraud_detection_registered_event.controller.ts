import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import {
  HandleCancelPendingPixFraudDetectionRegisteredEventUseCase as UseCase,
  PixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  PixFraudDetectionEventEmitterController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleCancelPendingPixFraudDetectionRegisteredEventRequest = Pick<
  PixFraudDetection,
  'id'
>;

export class HandleCancelPendingPixFraudDetectionRegisteredEventRequest
  extends AutoValidator
  implements THandleCancelPendingPixFraudDetectionRegisteredEventRequest
{
  @IsUUID(4)
  id: string;

  constructor(
    props: THandleCancelPendingPixFraudDetectionRegisteredEventRequest,
  ) {
    super(props);
  }
}

type THandleCancelPendingPixFraudDetectionRegisteredEventResponse = Pick<
  PixFraudDetection,
  'id' | 'state'
>;

export class HandleCancelPendingPixFraudDetectionRegisteredEventResponse
  extends AutoValidator
  implements THandleCancelPendingPixFraudDetectionRegisteredEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixFraudDetectionState)
  state!: PixFraudDetectionState;

  constructor(
    props: THandleCancelPendingPixFraudDetectionRegisteredEventResponse,
  ) {
    super(props);
  }
}

export class HandleCancelPendingPixFraudDetectionRegisteredEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixFraudDetectionRepository: PixFraudDetectionRepository,
    pixFraudDetectionGateway: PixFraudDetectionGateway,
    pixFraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context:
        HandleCancelPendingPixFraudDetectionRegisteredEventController.name,
    });

    const controllerEventEmitter = new PixFraudDetectionEventEmitterController(
      pixFraudDetectionEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixFraudDetectionRepository,
      pixFraudDetectionGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleCancelPendingPixFraudDetectionRegisteredEventRequest,
  ): Promise<HandleCancelPendingPixFraudDetectionRegisteredEventResponse> {
    this.logger.debug(
      'Handle cancel pending pix fraud detection registered event request.',
      { request },
    );

    const { id } = request;

    const updatedPixFraudDetection = await this.usecase.execute(id);

    if (!updatedPixFraudDetection) return null;

    const response =
      new HandleCancelPendingPixFraudDetectionRegisteredEventResponse({
        id: updatedPixFraudDetection.id,
        state: updatedPixFraudDetection.state,
      });

    this.logger.info(
      'Handle cancel pending pix fraud detection registered response.',
      { response },
    );

    return response;
  }
}
