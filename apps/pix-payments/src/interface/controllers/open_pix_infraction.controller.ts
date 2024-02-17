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
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import { OpenPixInfractionUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventEmitterController,
} from '@zro/pix-payments/interface';

type TOpenPixInfractionRequest = Pick<PixInfraction, 'issueId' | 'description'>;

export class OpenPixInfractionRequest
  extends AutoValidator
  implements TOpenPixInfractionRequest
{
  @IsInt()
  @IsPositive()
  issueId: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description: string;

  constructor(props: TOpenPixInfractionRequest) {
    super(props);
  }
}

type TOpenPixInfractionResponse = Pick<
  PixInfraction,
  'id' | 'issueId' | 'infractionPspId' | 'state' | 'status'
>;
export class OpenPixInfractionResponse
  extends AutoValidator
  implements TOpenPixInfractionResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  constructor(props: TOpenPixInfractionResponse) {
    super(props);
  }
}

export class OpenPixInfractionController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: OpenPixInfractionController.name });

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
    request: OpenPixInfractionRequest,
  ): Promise<OpenPixInfractionResponse> {
    this.logger.debug('Open infraction request.', { request });

    const { issueId, description } = request;
    const infractionUpdated = await this.usecase.execute(issueId, description);

    if (!infractionUpdated) return null;

    const response = new OpenPixInfractionResponse({
      id: infractionUpdated.id,
      issueId: infractionUpdated.issueId,
      state: infractionUpdated.state,
      status: infractionUpdated.status,
    });

    this.logger.info('Open infraction response.', {
      infraction: response,
    });

    return response;
  }
}
