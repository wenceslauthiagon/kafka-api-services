import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfraction,
  PixInfractionStatus,
  PixInfractionState,
  PixInfractionAnalysisResultType,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import { InAnalysisPixInfractionUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventEmitterController,
} from '@zro/pix-payments/interface';

type TInAnalysisPixInfractionRequest = Pick<
  PixInfraction,
  'issueId' | 'description'
>;

export class InAnalysisPixInfractionRequest
  extends AutoValidator
  implements TInAnalysisPixInfractionRequest
{
  @IsInt()
  @IsPositive()
  issueId: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description: string;

  constructor(props: TInAnalysisPixInfractionRequest) {
    super(props);
  }
}

type TInAnalysisPixInfractionResponse = Pick<
  PixInfraction,
  | 'id'
  | 'issueId'
  | 'infractionPspId'
  | 'description'
  | 'state'
  | 'status'
  | 'ispbDebitedParticipant'
  | 'ispbCreditedParticipant'
  | 'endToEndId'
  | 'analysisResult'
  | 'analysisDetails'
>;
export class InAnalysisPixInfractionResponse
  extends AutoValidator
  implements TInAnalysisPixInfractionResponse
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsUUID(4)
  infractionPspId?: string;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  @IsOptional()
  @IsString()
  endToEndId?: string;

  @IsOptional()
  @IsEnum(PixInfractionAnalysisResultType)
  analysisResult?: PixInfractionAnalysisResultType;

  @IsOptional()
  @IsString()
  analysisDetails?: string;

  constructor(props: TInAnalysisPixInfractionResponse) {
    super(props);
  }
}

export class InAnalysisPixInfractionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: InAnalysisPixInfractionController.name,
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
    request: InAnalysisPixInfractionRequest,
  ): Promise<InAnalysisPixInfractionResponse> {
    this.logger.debug('InAnalysis infraction request.', { request });

    const { issueId, description } = request;
    const infractionUpdated = await this.usecase.execute(issueId, description);

    if (!infractionUpdated) return null;

    const response = new InAnalysisPixInfractionResponse({
      id: infractionUpdated.id,
      issueId: infractionUpdated.issueId,
      state: infractionUpdated.state,
      status: infractionUpdated.status,
    });

    this.logger.info('InAnalysis infraction response.', {
      infraction: response,
    });

    return response;
  }
}
