import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import {
  HandleCancelPendingPixFraudDetectionReceivedEventUseCase as UseCase,
  IssuePixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  PixFraudDetectionEventEmitterController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleCancelPendingPixFraudDetectionReceivedEventRequest = Pick<
  PixFraudDetection,
  'id' | 'externalId' | 'document' | 'fraudType' | 'status' | 'key'
>;

export class HandleCancelPendingPixFraudDetectionReceivedEventRequest
  extends AutoValidator
  implements THandleCancelPendingPixFraudDetectionReceivedEventRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  externalId: string;

  @IsString()
  @Length(11, 14)
  document: string;

  @IsEnum(PixFraudDetectionType)
  fraudType: PixFraudDetectionType;

  @IsOptional()
  @IsString()
  key?: string;

  @IsEnum(PixFraudDetectionStatus)
  status: PixFraudDetectionStatus;

  constructor(
    props: THandleCancelPendingPixFraudDetectionReceivedEventRequest,
  ) {
    super(props);
  }
}

type THandleCancelPendingPixFraudDetectionReceivedEventResponse = Pick<
  PixFraudDetection,
  'id' | 'state'
>;

export class HandleCancelPendingPixFraudDetectionReceivedEventResponse
  extends AutoValidator
  implements THandleCancelPendingPixFraudDetectionReceivedEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixFraudDetectionState)
  state!: PixFraudDetectionState;

  constructor(
    props: THandleCancelPendingPixFraudDetectionReceivedEventResponse,
  ) {
    super(props);
  }
}

export class HandleCancelPendingPixFraudDetectionReceivedEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixFraudDetectionRepository: PixFraudDetectionRepository,
    pixFraudDetectionGateway: IssuePixFraudDetectionGateway,
    pixFraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleCancelPendingPixFraudDetectionReceivedEventController.name,
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
    request: HandleCancelPendingPixFraudDetectionReceivedEventRequest,
  ): Promise<HandleCancelPendingPixFraudDetectionReceivedEventResponse> {
    this.logger.debug(
      'Handle received pending canceled pix fraud detection event request.',
      { request },
    );

    const { externalId, document, fraudType, key, status } = request;

    const pixFraudDetection = new PixFraudDetectionEntity({
      externalId,
      document,
      fraudType,
      key,
      status,
    });

    const updatedPixFraudDetection =
      await this.usecase.execute(pixFraudDetection);

    if (!updatedPixFraudDetection) return null;

    const response =
      new HandleCancelPendingPixFraudDetectionReceivedEventResponse({
        id: updatedPixFraudDetection.id,
        state: updatedPixFraudDetection.state,
      });

    this.logger.info(
      'Handle received pending canceled pix fraud detection event response.',
      { response },
    );

    return response;
  }
}
