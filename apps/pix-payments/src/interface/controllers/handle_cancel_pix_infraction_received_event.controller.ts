import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionAnalysisResultType,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  HandleCancelPixInfractionReceivedEventUseCase as UseCase,
  OperationService,
} from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventEmitterController,
} from '@zro/pix-payments/interface';

export type THandleCancelPixInfractionReceivedEventRequest = Pick<
  PixInfraction,
  'infractionPspId' | 'analysisResult' | 'analysisDetails'
>;

export class HandleCancelPixInfractionReceivedEventRequest
  extends AutoValidator
  implements THandleCancelPixInfractionReceivedEventRequest
{
  @IsUUID(4)
  infractionPspId: string;

  @IsOptional()
  @IsString()
  analysisDetails!: string;

  @IsEnum(PixInfractionAnalysisResultType)
  analysisResult!: PixInfractionAnalysisResultType;

  constructor(props: THandleCancelPixInfractionReceivedEventRequest) {
    super(props);
  }
}

export class HandleCancelPixInfractionReceivedEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    operationService: OperationService,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleCancelPixInfractionReceivedEventController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      operationService,
      infractionRepository,
      pixInfractionRefundOperationRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleCancelPixInfractionReceivedEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle cancel pix infraction event request.', {
      request,
    });

    const { infractionPspId, analysisDetails, analysisResult } = request;

    await this.usecase.execute(
      infractionPspId,
      analysisResult,
      analysisDetails,
    );

    this.logger.info('Handle cancel pix infraction event finished.');
  }
}
