import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  RemittanceOrderRepository,
  CryptoRemittanceRepository,
  System,
  SystemEntity,
  Remittance,
  RemittanceRepository,
  RemittanceOrderRemittanceRepository,
  CryptoOrderRepository,
  RemittanceEntity,
} from '@zro/otc/domain';
import {
  OtcBotService,
  HandleClosedRemittanceEventUseCase as UseCase,
} from '@zro/otc/application';

export type THandleClosedRemittanceEventRequest = Pick<Remittance, 'id'> & {
  systemId: System['id'];
};

export class HandleClosedRemittanceEventRequest
  extends AutoValidator
  implements THandleClosedRemittanceEventRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  systemId: System['id'];

  constructor(props: THandleClosedRemittanceEventRequest) {
    super(props);
  }
}

export class HandleClosedRemittanceEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceRepository: RemittanceRepository,
    remittanceOrderRepository: RemittanceOrderRepository,
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    cryptoOrderRepository: CryptoOrderRepository,
    otcBotService: OtcBotService,
  ) {
    this.logger = logger.child({
      context: HandleClosedRemittanceEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      remittanceRepository,
      remittanceOrderRepository,
      remittanceOrderRemittanceRepository,
      cryptoRemittanceRepository,
      cryptoOrderRepository,
      otcBotService,
    );
  }

  async execute(
    request: HandleClosedRemittanceEventRequest,
    botOtcSystem: System,
  ): Promise<void> {
    this.logger.debug('Handle closed remittance event.', { request });

    const { id, systemId } = request;

    const remittance = new RemittanceEntity({
      id,
      system: new SystemEntity({
        id: systemId,
      }),
    });

    await this.usecase.execute(remittance, botOtcSystem);

    this.logger.debug('Handle closed remittance event finished.');
  }
}
