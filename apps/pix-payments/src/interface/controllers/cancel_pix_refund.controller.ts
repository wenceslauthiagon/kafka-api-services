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
  PixRefundRejectionReason,
  PixRefundState,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  CancelPixRefundUseCase as UseCase,
  OperationService,
} from '@zro/pix-payments/application';
import {
  PixRefundEventEmitterControllerInterface,
  PixRefundEventEmitterController,
} from '@zro/pix-payments/interface';

export type TCancelPixRefundRequest = Pick<
  PixRefund,
  'issueId' | 'analysisDetails' | 'rejectionReason'
>;

export class CancelPixRefundRequest
  extends AutoValidator
  implements TCancelPixRefundRequest
{
  @IsInt()
  @IsPositive()
  issueId: number;

  @IsString()
  @IsOptional()
  @MaxLength(1900)
  analysisDetails?: string;

  @IsEnum(PixRefundRejectionReason)
  @IsOptional()
  rejectionReason?: PixRefundRejectionReason;

  constructor(props: TCancelPixRefundRequest) {
    super(props);
  }
}

type TCancelPixRefundResponse = Pick<PixRefund, 'id' | 'state'>;

export class CancelPixRefundResponse
  extends AutoValidator
  implements TCancelPixRefundResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixRefundState)
  state: PixRefundState;

  constructor(props: TCancelPixRefundResponse) {
    super(props);
  }
}

export class CancelPixRefundController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixRefundRepository: PixRefundRepository,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    eventEmitter: PixRefundEventEmitterControllerInterface,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: CancelPixRefundController.name,
    });

    const controllerEventEmitter = new PixRefundEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixRefundRepository,
      pixInfractionRefundOperationRepository,
      controllerEventEmitter,
      operationService,
    );
  }

  async execute(
    request: CancelPixRefundRequest,
  ): Promise<CancelPixRefundResponse> {
    this.logger.debug('Cancel pixRefund.', { request });

    const { issueId, analysisDetails, rejectionReason } = request;
    const pixRefundUpdated = await this.usecase.execute(
      issueId,
      analysisDetails,
      rejectionReason,
    );

    if (!pixRefundUpdated) return null;

    const response = new CancelPixRefundResponse({
      id: pixRefundUpdated.id,
      state: pixRefundUpdated.state,
    });

    this.logger.info('Cancel pixRefund response.', {
      pixRefund: response,
    });

    return response;
  }
}
