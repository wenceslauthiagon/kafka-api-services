import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { HandleCancelPixFraudDetectionReceivedEventUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixFraudDetectionEventEmitterController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleCancelPixFraudDetectionReceivedEventRequest = Pick<
  PixFraudDetection,
  'externalId' | 'document' | 'fraudType' | 'status' | 'key'
>;

export class HandleCancelPixFraudDetectionReceivedEventRequest
  extends AutoValidator
  implements THandleCancelPixFraudDetectionReceivedEventRequest
{
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

  constructor(props: THandleCancelPixFraudDetectionReceivedEventRequest) {
    super(props);
  }
}

export class HandleCancelPixFraudDetectionReceivedEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    fraudDetectionRepository: PixFraudDetectionRepository,
    fraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleCancelPixFraudDetectionReceivedEventController.name,
    });

    const controllerEventEmitter = new PixFraudDetectionEventEmitterController(
      fraudDetectionEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      fraudDetectionRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleCancelPixFraudDetectionReceivedEventRequest,
  ): Promise<void> {
    this.logger.debug(
      'Handle received canceled pix fraud detection event request.',
      {
        request,
      },
    );

    const { externalId, document, fraudType, key, status } = request;

    const pixFraudDetection = new PixFraudDetectionEntity({
      externalId,
      document,
      fraudType,
      key,
      status,
    });

    await this.usecase.execute(pixFraudDetection);

    this.logger.info('Handled received canceled pix fraud detection event.');
  }
}
