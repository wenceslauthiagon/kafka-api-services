import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { RegisterPixFraudDetectionUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixFraudDetectionEventEmitterController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type TRegisterPixFraudDetectionRequest = Pick<
  PixFraudDetection,
  'id' | 'issueId' | 'document' | 'fraudType' | 'key'
>;

export class RegisterPixFraudDetectionRequest
  extends AutoValidator
  implements TRegisterPixFraudDetectionRequest
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsString()
  @Length(11, 14)
  document: string;

  @IsEnum(PixFraudDetectionType)
  fraudType: PixFraudDetectionType;

  @IsOptional()
  @IsString()
  key?: string;

  constructor(props: TRegisterPixFraudDetectionRequest) {
    super(props);
  }
}

type TRegisterPixFraudDetectionResponse = Pick<
  PixFraudDetection,
  'id' | 'state'
>;

export class RegisterPixFraudDetectionResponse
  extends AutoValidator
  implements TRegisterPixFraudDetectionResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixFraudDetectionState)
  state!: PixFraudDetectionState;

  constructor(props: TRegisterPixFraudDetectionResponse) {
    super(props);
  }
}

export class RegisterPixFraudDetectionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    fraudDetectionRepository: PixFraudDetectionRepository,
    fraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: RegisterPixFraudDetectionController.name,
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
    request: RegisterPixFraudDetectionRequest,
  ): Promise<RegisterPixFraudDetectionResponse> {
    this.logger.debug('Register pix fraud detection request.', { request });

    const { id, issueId, document, fraudType, key } = request;

    const registerPixFraudDetection = await this.usecase.execute(
      id,
      issueId,
      document,
      fraudType,
      key,
    );

    const response = new RegisterPixFraudDetectionResponse({
      id: registerPixFraudDetection.id,
      state: registerPixFraudDetection.state,
    });

    this.logger.info('Register pix fraud detection response.');

    return response;
  }
}
