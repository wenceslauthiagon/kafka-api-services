import { Logger } from 'winston';
import {
  IsNumber,
  IsUUID,
  IsEnum,
  Equals,
  IsOptional,
  IsInt,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  Remittance,
  RemittanceRepository,
  RemittanceStatus,
} from '@zro/otc/domain';
import { ManuallyCloseRemittanceUseCase } from '@zro/otc/application';
import {
  RemittanceEventEmitterControllerInterface,
  RemittanceEventEmitterController,
} from '@zro/otc/interface';

type TManuallyCloseRemittanceRequest = Pick<
  Remittance,
  'id' | 'bankQuote' | 'resultAmount'
> & { status?: Remittance['status'] };

export class ManuallyCloseRemittanceRequest
  extends AutoValidator
  implements TManuallyCloseRemittanceRequest
{
  @IsUUID(4)
  id: string;

  @IsNumber()
  bankQuote: number;

  @IsInt()
  resultAmount: number;

  @IsOptional()
  @IsEnum(RemittanceStatus)
  @Equals(RemittanceStatus.CLOSED_MANUALLY)
  status?: RemittanceStatus;

  constructor(props: TManuallyCloseRemittanceRequest) {
    super(props);
  }
}

type TManuallyCloseRemittanceResponse = Pick<Remittance, 'id' | 'status'>;

export class ManuallyCloseRemittanceResponse
  extends AutoValidator
  implements TManuallyCloseRemittanceResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(RemittanceStatus)
  status: RemittanceStatus;

  constructor(props: TManuallyCloseRemittanceResponse) {
    super(props);
  }
}

export class ManuallyCloseRemittanceController {
  private usecase: ManuallyCloseRemittanceUseCase;

  constructor(
    private logger: Logger,
    remittanceRepository: RemittanceRepository,
    remittanceServiceEventEmitter: RemittanceEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ManuallyCloseRemittanceController.name,
    });

    const remittanceEventEmitter = new RemittanceEventEmitterController(
      remittanceServiceEventEmitter,
    );

    this.usecase = new ManuallyCloseRemittanceUseCase(
      logger,
      remittanceRepository,
      remittanceEventEmitter,
    );
  }

  async execute(
    request: ManuallyCloseRemittanceRequest,
  ): Promise<ManuallyCloseRemittanceResponse> {
    this.logger.debug('Manually Closing remittance request.', { request });

    const { id, bankQuote, resultAmount, status } = request;

    const updatedRemittance = await this.usecase.execute(
      id,
      bankQuote,
      resultAmount,
      status,
    );

    const response = new ManuallyCloseRemittanceResponse({
      id: updatedRemittance.id,
      status: updatedRemittance.status,
    });

    this.logger.info('Close remittance response.', {
      closedRemittance: response,
    });

    return response;
  }
}
