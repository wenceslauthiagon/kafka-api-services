import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  Provider,
  ProviderEntity,
  ProviderRepository,
  RemittanceOrder,
  RemittanceOrderRepository,
  RemittanceOrderSide,
  RemittanceOrderType,
  System,
  SystemEntity,
  SystemRepository,
} from '@zro/otc/domain';
import {
  OperationService,
  CreateRemittanceOrderUseCase as UseCase,
} from '@zro/otc/application';
import { Logger } from 'winston';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { IsEnum, IsInt, IsPositive, IsUUID } from 'class-validator';
import {
  RemittanceOrderEventEmitterController,
  RemittanceOrderEventEmitterControllerInterface,
} from '@zro/otc/interface';

export type TCreateRemittanceOrderRequest = Pick<
  RemittanceOrder,
  'id' | 'side' | 'amount' | 'type'
> & {
  currencyId: Currency['id'];
  systemId: System['id'];
  providerId: Provider['id'];
};

export class CreateRemittanceOrderRequest
  extends AutoValidator
  implements TCreateRemittanceOrderRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(RemittanceOrderSide)
  side: RemittanceOrderSide;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsInt()
  @IsPositive()
  currencyId: Currency['id'];

  @IsUUID(4)
  systemId: System['id'];

  @IsUUID(4)
  providerId: Provider['id'];

  @IsEnum(RemittanceOrderType)
  type: RemittanceOrderType;

  constructor(props: TCreateRemittanceOrderRequest) {
    super(props);
  }
}

type TCreateRemittanceOrderResponse = Pick<RemittanceOrder, 'id' | 'createdAt'>;

export class CreateRemittanceOrderResponse
  extends AutoValidator
  implements TCreateRemittanceOrderResponse
{
  @IsUUID(4)
  id: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateRemittanceOrderResponse) {
    super(props);
  }
}

export class CreateRemittanceOrderController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceOrderRepository: RemittanceOrderRepository,
    systemRepository: SystemRepository,
    providerRepository: ProviderRepository,
    operationService: OperationService,
    serviceRemittanceOrderEmitter: RemittanceOrderEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateRemittanceOrderController.name,
    });

    const remittanceOrderEventEmitter =
      new RemittanceOrderEventEmitterController(serviceRemittanceOrderEmitter);

    this.usecase = new UseCase(
      this.logger,
      remittanceOrderRepository,
      systemRepository,
      providerRepository,
      operationService,
      remittanceOrderEventEmitter,
    );
  }

  async execute(
    request: CreateRemittanceOrderRequest,
  ): Promise<CreateRemittanceOrderResponse> {
    this.logger.debug('Create remittance order request.', { request });

    const { id, amount, currencyId, providerId, side, systemId, type } =
      request;

    const currency = new CurrencyEntity({ id: currencyId });
    const system = new SystemEntity({ id: systemId });
    const provider = new ProviderEntity({ id: providerId });

    const remittance = await this.usecase.execute(
      id,
      side,
      currency,
      amount,
      system,
      provider,
      type,
    );

    if (!remittance) return null;

    const response = new CreateRemittanceOrderResponse({
      id: remittance.id,
      createdAt: remittance.createdAt,
    });

    this.logger.debug('Created new remittance order.', {
      remittanceOrder: remittance,
    });

    return response;
  }
}
