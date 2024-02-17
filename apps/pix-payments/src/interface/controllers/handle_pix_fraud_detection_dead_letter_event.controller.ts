import { Logger } from 'winston';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { AutoValidator, FailedEntity } from '@zro/common';
import { HandlePixFraudDetectionDeadLetterEventUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixFraudDetection,
  PixFraudDetectionRepository,
} from '@zro/pix-payments/domain';

type THandlePixFraudDetectionDeadLetterEventRequest = Pick<
  PixFraudDetection,
  'id'
> & {
  failedMessage?: string;
  failedCode?: string;
};

export class HandlePixFraudDetectionDeadLetterEventRequest
  extends AutoValidator
  implements THandlePixFraudDetectionDeadLetterEventRequest
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsString()
  failedMessage: string;

  @IsOptional()
  @IsString()
  failedCode: string;

  constructor(props: THandlePixFraudDetectionDeadLetterEventRequest) {
    super(props);
  }
}

export class HandlePixFraudDetectionDeadLetterEventController {
  /**
   * Handler triggered when an dead letter is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param repository PixFraudDetection repository.
   */
  constructor(
    private logger: Logger,
    repository: PixFraudDetectionRepository,
  ) {
    this.logger = logger.child({
      context: HandlePixFraudDetectionDeadLetterEventController.name,
    });

    this.usecase = new UseCase(this.logger, repository);
  }

  async execute(
    request: HandlePixFraudDetectionDeadLetterEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle pix fraud detection dead letter event request.', {
      request,
    });

    const { id, failedMessage, failedCode } = request;

    const failed = new FailedEntity({
      code: failedCode,
      message: failedMessage,
    });

    await this.usecase.execute(id, failed);

    this.logger.info('Handled pix fraud detection dead letter event.');
  }
}
