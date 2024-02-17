import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionRepository,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { HandleReceivePixFraudDetectionEventUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixFraudDetectionEventEmitterController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type THandleReceivePixFraudDetectionEventRequest = Pick<
  PixFraudDetection,
  'externalId' | 'document' | 'fraudType' | 'status' | 'key'
>;

export class HandleReceivePixFraudDetectionEventRequest
  extends AutoValidator
  implements THandleReceivePixFraudDetectionEventRequest
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

  constructor(props: THandleReceivePixFraudDetectionEventRequest) {
    super(props);
  }
}

export class HandleReceivePixFraudDetectionEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    fraudDetectionRepository: PixFraudDetectionRepository,
    fraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleReceivePixFraudDetectionEventController.name,
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
    request: HandleReceivePixFraudDetectionEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle received pix fraud detection event request.', {
      request,
    });

    const { externalId, document, fraudType, key, status } = request;

    await this.usecase.execute(externalId, document, fraudType, status, key);

    this.logger.info('Handled received pix fraud detection event.');
  }
}
