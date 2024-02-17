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
  PixRefund,
  PixRefundRepository,
  PixRefundState,
} from '@zro/pix-payments/domain';
import { ClosePixRefundUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixRefundEventEmitterControllerInterface,
  PixRefundEventEmitterController,
} from '@zro/pix-payments/interface';

export type TClosePixRefundRequest = Pick<
  PixRefund,
  'issueId' | 'analysisDetails'
>;

export class ClosePixRefundRequest
  extends AutoValidator
  implements TClosePixRefundRequest
{
  @IsInt()
  @IsPositive()
  issueId: number;

  @IsString()
  @MaxLength(1900)
  @IsOptional()
  analysisDetails?: string;

  constructor(props: TClosePixRefundRequest) {
    super(props);
  }
}

type TClosePixRefundResponse = Pick<PixRefund, 'id' | 'state'>;

export class ClosePixRefundResponse
  extends AutoValidator
  implements TClosePixRefundResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundState)
  state: PixRefundState;

  constructor(props: TClosePixRefundResponse) {
    super(props);
  }
}

export class ClosePixRefundController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixRefundRepository: PixRefundRepository,
    eventEmitter: PixRefundEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ClosePixRefundController.name,
    });

    const controllerEventEmitter = new PixRefundEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixRefundRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: ClosePixRefundRequest,
  ): Promise<ClosePixRefundResponse> {
    this.logger.debug('Close pixRefund.', { request });

    const { issueId, analysisDetails } = request;
    const pixRefundUpdated = await this.usecase.execute(
      issueId,
      analysisDetails,
    );

    if (!pixRefundUpdated) return null;

    const response = new ClosePixRefundResponse({
      id: pixRefundUpdated.id,
      state: pixRefundUpdated.state,
    });

    this.logger.info('Close pixRefund response.', { pixRefund: response });

    return response;
  }
}
