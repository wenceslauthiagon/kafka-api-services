import { Logger } from 'winston';
import { IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  SystemRepository,
  RemittanceOrderRepository,
  CryptoRemittance,
  CryptoRemittanceRepository,
  System,
  SystemEntity,
  SettlementDateCode,
} from '@zro/otc/domain';
import { HandleFilledCryptoRemittanceEventUseCase as UseCase } from '@zro/otc/application';
import {
  RemittanceOrderEventEmitterController,
  RemittanceOrderEventEmitterControllerInterface,
} from '@zro/otc/interface';

type SystemName = System['name'];

export type THandleFilledCryptoRemittanceEventRequest = Pick<
  CryptoRemittance,
  'id'
> & { systemName: SystemName };

export class HandleFilledCryptoRemittanceEventRequest
  extends AutoValidator
  implements THandleFilledCryptoRemittanceEventRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(255)
  systemName: SystemName;

  constructor(props: THandleFilledCryptoRemittanceEventRequest) {
    super(props);
  }
}

export class HandleFilledCryptoRemittanceEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    remittanceOrderRepository: RemittanceOrderRepository,
    systemRepository: SystemRepository,
    serviceRemittanceOrderEmitter: RemittanceOrderEventEmitterControllerInterface,
    defaultSendDateCode: SettlementDateCode,
    defaultReceiveDateCode: SettlementDateCode,
  ) {
    this.logger = logger.child({
      context: HandleFilledCryptoRemittanceEventController.name,
    });

    const remittanceOrderEventEmitter =
      new RemittanceOrderEventEmitterController(serviceRemittanceOrderEmitter);

    this.usecase = new UseCase(
      this.logger,
      cryptoRemittanceRepository,
      remittanceOrderRepository,
      systemRepository,
      remittanceOrderEventEmitter,
      defaultSendDateCode,
      defaultReceiveDateCode,
    );
  }

  async execute(
    request: HandleFilledCryptoRemittanceEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle filled crypto remittance event.', { request });

    const { id, systemName } = request;

    const system = new SystemEntity({
      name: systemName,
    });

    await this.usecase.execute(id, system);
  }
}
