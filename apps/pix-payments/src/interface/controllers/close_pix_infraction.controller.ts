import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfraction,
  PixInfractionStatus,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionAnalysisResultType,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  ClosePixInfractionUseCase as UseCase,
  OperationService,
} from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventEmitterController,
} from '@zro/pix-payments/interface';

export type TClosePixInfractionRequest = Pick<
  PixInfraction,
  'issueId' | 'analysisResult' | 'analysisDetails'
>;

export class ClosePixInfractionRequest
  extends AutoValidator
  implements TClosePixInfractionRequest
{
  @IsInt()
  @IsPositive()
  issueId!: number;

  @IsOptional()
  @IsString()
  analysisDetails!: string;

  @IsEnum(PixInfractionAnalysisResultType)
  analysisResult!: PixInfractionAnalysisResultType;

  constructor(props: TClosePixInfractionRequest) {
    super(props);
  }
}

type TClosePixInfractionResponse = Pick<
  PixInfraction,
  'id' | 'issueId' | 'state' | 'status'
>;

export class ClosePixInfractionResponse
  extends AutoValidator
  implements TClosePixInfractionResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: TClosePixInfractionResponse) {
    super(props);
  }
}

export class ClosePixInfractionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: ClosePixInfractionController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      infractionRepository,
      pixInfractionRefundOperationRepository,
      controllerEventEmitter,
      operationService,
    );
  }

  async execute(
    request: ClosePixInfractionRequest,
  ): Promise<ClosePixInfractionResponse> {
    this.logger.debug('Close infraction request.', { request });

    const { issueId, analysisDetails, analysisResult } = request;
    const infractionUpdated = await this.usecase.execute(
      issueId,
      analysisResult,
      analysisDetails,
    );

    if (!infractionUpdated) return null;

    const response = new ClosePixInfractionResponse({
      id: infractionUpdated.id,
      issueId: infractionUpdated.issueId,
      state: infractionUpdated.state,
      status: infractionUpdated.status,
    });

    this.logger.info('Close infraction response.', { infraction: response });

    return response;
  }
}
