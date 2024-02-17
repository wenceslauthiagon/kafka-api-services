import { Logger } from 'winston';
import {
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitter,
  PixDepositInvalidStateException,
  WarningDepositChecker,
  WarningDepositCheck,
} from '@zro/pix-payments/application';

@WarningDepositCheck
export class HandleWarningPixDepositIsReceitaFederalEventUseCase extends WarningDepositChecker {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Repository.
   * @param pixDepositEventEmitter pix deposit event emmiter.
   * @param pixPaymentReceitaFederalCnpj Receita federal deposit thirdPart document (cnpj).
   */
  constructor(
    protected logger: Logger,
    protected readonly pixDepositCacheRepository: PixDepositCacheRepository,
    protected readonly pixDepositEventEmitter: PixDepositEventEmitter,
    private readonly pixPaymentReceitaFederalCnpj: string,
  ) {
    super(logger, pixDepositCacheRepository, pixDepositEventEmitter);

    this.logger = logger.child({
      context: HandleWarningPixDepositIsReceitaFederalEventUseCase.name,
    });
  }

  async check(deposit: PixDeposit): Promise<boolean> {
    if (
      ![PixDepositState.NEW, PixDepositState.WAITING].includes(deposit.state)
    ) {
      throw new PixDepositInvalidStateException(deposit);
    }

    if (deposit.state !== PixDepositState.WAITING) {
      deposit.state = PixDepositState.WAITING;

      await this.pixDepositCacheRepository.update(deposit);
    }

    return !(deposit.thirdPartDocument === this.pixPaymentReceitaFederalCnpj);
  }
}
