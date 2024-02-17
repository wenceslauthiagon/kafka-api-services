import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionAnalysisResultType,
} from '@zro/pix-payments/domain';
import { HandleClosePixInfractionReceivedEventUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventEmitterController,
} from '@zro/pix-payments/interface';

export type THandleClosePixInfractionReceivedEventRequest = Pick<
  PixInfraction,
  'infractionPspId' | 'analysisResult' | 'analysisDetails'
>;

export class HandleClosePixInfractionReceivedEventRequest
  extends AutoValidator
  implements THandleClosePixInfractionReceivedEventRequest
{
  @IsUUID(4)
  infractionPspId: string;

  @IsOptional()
  @IsString()
  analysisDetails!: string;

  @IsEnum(PixInfractionAnalysisResultType)
  analysisResult!: PixInfractionAnalysisResultType;

  constructor(props: THandleClosePixInfractionReceivedEventRequest) {
    super(props);
  }
}

export class HandleClosePixInfractionReceivedEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleClosePixInfractionReceivedEventController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      infractionRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleClosePixInfractionReceivedEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle close pix infraction event request.', {
      request,
    });

    const { infractionPspId, analysisDetails, analysisResult } = request;

    await this.usecase.execute(
      infractionPspId,
      analysisResult,
      analysisDetails,
    );

    this.logger.info('Handle close pix infraction event finished.');
  }
}
