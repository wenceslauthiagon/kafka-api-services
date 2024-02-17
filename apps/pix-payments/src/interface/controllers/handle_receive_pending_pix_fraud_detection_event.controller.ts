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
  HandleReceivePendingPixFraudDetectionEventUseCase as UseCase,
  IssuePixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  PixFraudDetectionEventEmitterController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleReceivePendingPixFraudDetectionEventRequest = Pick<
  PixFraudDetection,
  'id' | 'externalId' | 'document' | 'fraudType' | 'status' | 'key' | 'state'
>;

export class HandleReceivePendingPixFraudDetectionEventRequest
  extends AutoValidator
  implements THandleReceivePendingPixFraudDetectionEventRequest
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

  @IsEnum(PixFraudDetectionState)
  state: PixFraudDetectionState;

  constructor(props: THandleReceivePendingPixFraudDetectionEventRequest) {
    super(props);
  }
}

type THandleReceivePendingPixFraudDetectionEventResponse = Pick<
  PixFraudDetection,
  'id' | 'state'
>;

export class HandleReceivePendingPixFraudDetectionEventResponse
  extends AutoValidator
  implements THandleReceivePendingPixFraudDetectionEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixFraudDetectionState)
  state!: PixFraudDetectionState;

  constructor(props: THandleReceivePendingPixFraudDetectionEventResponse) {
    super(props);
  }
}

export class HandleReceivePendingPixFraudDetectionEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixFraudDetectionRepository: PixFraudDetectionRepository,
    pixFraudDetectionGateway: IssuePixFraudDetectionGateway,
    pixFraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleReceivePendingPixFraudDetectionEventController.name,
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
    request: HandleReceivePendingPixFraudDetectionEventRequest,
  ): Promise<HandleReceivePendingPixFraudDetectionEventResponse> {
    this.logger.debug(
      'Handle received pending pix fraud detection event request.',
      {
        request,
      },
    );

    const { id, externalId, document, fraudType, key, status, state } = request;

    const pixFraudDetection = new PixFraudDetectionEntity({
      id,
      externalId,
      document,
      fraudType,
      key,
      status,
      state,
    });

    const updatedPixFraudDetection =
      await this.usecase.execute(pixFraudDetection);

    if (!updatedPixFraudDetection) return null;

    const response = new HandleReceivePendingPixFraudDetectionEventResponse({
      id: updatedPixFraudDetection.id,
      state: updatedPixFraudDetection.state,
    });

    this.logger.info(
      'Handle received pending pix fraud detection event response.',
      {
        response,
      },
    );

    return response;
  }
}
