import { Logger } from 'winston';
import { IsString, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { SpreadRepository } from '@zro/otc/domain';
import {
  DeleteSpreadUseCase as UseCase,
  OperationService,
} from '@zro/otc/application';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  SpreadEventEmitterController,
  SpreadEventEmitterControllerInterface,
} from '@zro/otc/interface';

type TDeleteSpreadRequest = {
  currencySymbol: Currency['symbol'];
};

export class DeleteSpreadRequest
  extends AutoValidator
  implements TDeleteSpreadRequest
{
  @IsString()
  @MaxLength(255)
  currencySymbol: string;

  constructor(props: TDeleteSpreadRequest) {
    super(props);
  }
}

export class DeleteSpreadController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    spreadRepository: SpreadRepository,
    operationService: OperationService,
    serviceEventEmitter: SpreadEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: DeleteSpreadController.name });

    const eventEmitter = new SpreadEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      spreadRepository,
      operationService,
      eventEmitter,
    );
  }

  async execute(request: DeleteSpreadRequest): Promise<void> {
    this.logger.debug('Delete Spread request.', { request });

    const { currencySymbol } = request;

    const source = new CurrencyEntity({ symbol: currencySymbol });

    return this.usecase.execute(source);
  }
}
