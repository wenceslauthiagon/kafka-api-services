import { Logger } from 'winston';
import { IsEnum, IsInt, IsPositive, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import { CancelPixFraudDetectionRegisteredUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixFraudDetectionEventEmitterController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type TCancelPixFraudDetectionRegisteredRequest = Pick<
  PixFraudDetection,
  'issueId'
>;

export class CancelPixFraudDetectionRegisteredRequest
  extends AutoValidator
  implements TCancelPixFraudDetectionRegisteredRequest
{
  @IsInt()
  @IsPositive()
  issueId: number;

  constructor(props: TCancelPixFraudDetectionRegisteredRequest) {
    super(props);
  }
}

type TCancelPixFraudDetectionRegisteredResponse = Pick<
  PixFraudDetection,
  'id' | 'state'
>;

export class CancelPixFraudDetectionRegisteredResponse
  extends AutoValidator
  implements TCancelPixFraudDetectionRegisteredResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixFraudDetectionState)
  state!: PixFraudDetectionState;

  constructor(props: TCancelPixFraudDetectionRegisteredResponse) {
    super(props);
  }
}

export class CancelPixFraudDetectionRegisteredController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    fraudDetectionRepository: PixFraudDetectionRepository,
    fraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CancelPixFraudDetectionRegisteredController.name,
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
    request: CancelPixFraudDetectionRegisteredRequest,
  ): Promise<CancelPixFraudDetectionRegisteredResponse> {
    this.logger.debug('Cancel pix fraud detection registered request.', {
      request,
    });

    const { issueId } = request;

    const cancelPixFraudDetection = await this.usecase.execute(issueId);

    const response = new CancelPixFraudDetectionRegisteredResponse({
      id: cancelPixFraudDetection.id,
      state: cancelPixFraudDetection.state,
    });

    this.logger.info('Cancel pix fraud detection registered response.');

    return response;
  }
}
