import { Logger } from 'winston';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import {
  Payment,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  ReceivePaymentChargebackUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type TReceivePaymentChargebackRequest = Pick<
  Payment,
  'id' | 'chargebackReason' | 'failed'
>;

export class ReceivePaymentChargebackRequest
  extends AutoValidator
  implements TReceivePaymentChargebackRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  chargebackReason?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  constructor(props: TReceivePaymentChargebackRequest) {
    super(props);
  }
}

type TReceivePaymentChargebackResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt'
>;

export class ReceivePaymentChargebackResponse
  extends AutoValidator
  implements TReceivePaymentChargebackResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TReceivePaymentChargebackResponse) {
    super(props);
  }
}

export class ReceivePaymentChargebackController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    eventEmitter: PaymentEventEmitterControllerInterface,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: ReceivePaymentChargebackController.name,
    });

    const controllerEventEmitter = new PaymentEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      paymentRepository,
      controllerEventEmitter,
      operationService,
    );
  }

  async execute(
    request: ReceivePaymentChargebackRequest,
  ): Promise<ReceivePaymentChargebackResponse> {
    this.logger.debug('Receive Payment chargeback request.', { request });

    const { id, chargebackReason, failed } = request;

    const payment = await this.usecase.execute(id, chargebackReason, failed);

    if (!payment) return null;

    const response = new ReceivePaymentChargebackResponse({
      id: payment.id,
      state: payment.state,
      createdAt: payment.createdAt,
    });

    this.logger.info('Receive Payment chargeback response.', {
      payment: response,
    });

    return response;
  }
}
