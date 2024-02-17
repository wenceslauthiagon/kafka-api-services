import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyStateType,
  NotifyRegisterBankingTedEntity,
  NotifyRegisterBankingTedRepository,
  NotifyRegisterBankingTedStatus,
} from '@zro/api-topazio/domain';
import {
  BankingService,
  AdminBankingService,
  NotifyBankingTedNotFoundException,
} from '@zro/api-topazio/application';

export class HandleNotifyRegisterBankingTedTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyBankingTedRepository repository.
   * @param bankingService Banking service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyBankingTedRepository: NotifyRegisterBankingTedRepository,
    private readonly bankingService: BankingService,
    private readonly adminBankingService: AdminBankingService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyRegisterBankingTedTopazioEventUseCase.name,
    });
  }

  /**
   * NotifyRegister register and send to banking.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyRegisterBankingTedEntity): Promise<void> {
    const { transactionId, status } = payload;

    if (!transactionId || !status) {
      throw new MissingDataException([
        ...(!transactionId ? ['Transaction ID'] : []),
        ...(!status ? ['Status'] : []),
      ]);
    }

    // Save all notify in database
    payload.state = NotifyStateType.READY;
    await this.notifyBankingTedRepository.create(payload);

    // Get user banking TED by transactionId
    const bankingTed =
      await this.bankingService.getBankingTedByTransactionId(transactionId);

    if (bankingTed?.id) {
      this.logger.debug('BankingTed found by id.', { bankingTed });

      await this.processUserTED({
        ...payload,
        bankingTedId: bankingTed.id,
      });

      return;
    }

    // Get admin banking TED by transactionId
    const adminBankingTed =
      await this.adminBankingService.getAdminBankingTedByTransactionId(
        transactionId,
      );

    if (adminBankingTed?.id) {
      this.logger.debug('AdminBankingTed found by id.', { bankingTed });

      this.processAdminTED({
        ...payload,
        bankingTedId: adminBankingTed.id,
      });
    }

    if (!bankingTed && !adminBankingTed) {
      throw new NotifyBankingTedNotFoundException(transactionId);
    }
  }

  private async processUserTED(
    payload: NotifyRegisterBankingTedEntity & { bankingTedId: number },
  ): Promise<void> {
    const { transactionId, status, code, message, bankingTedId } = payload;

    switch (status) {
      case NotifyRegisterBankingTedStatus.ERROR:
      case NotifyRegisterBankingTedStatus.TED_NOT_DONE:
        await this.bankingService.rejectBankingTed(bankingTedId, code, message);
        break;

      case NotifyRegisterBankingTedStatus.TED_FORWARDED:
        await this.bankingService.forwardBankingTed(bankingTedId);
        break;

      case NotifyRegisterBankingTedStatus.TED_RECEIVED:
      case NotifyRegisterBankingTedStatus.CONFIRMED:
      case NotifyRegisterBankingTedStatus.ERROR_CONFIRMED:
      case NotifyRegisterBankingTedStatus.IN_PROCESSING:
      case NotifyRegisterBankingTedStatus.ERROR_NOTIFICATION:
        this.logger.debug(
          `Banking TED transaction: ${transactionId} with status: ${status}.`,
        );
        break;
    }
  }

  private async processAdminTED(
    payload: NotifyRegisterBankingTedEntity & { bankingTedId: string },
  ): Promise<void> {
    const { transactionId, status, code, message, bankingTedId } = payload;

    switch (status) {
      case NotifyRegisterBankingTedStatus.ERROR:
      case NotifyRegisterBankingTedStatus.TED_NOT_DONE:
        await this.adminBankingService.rejectAdminBankingTed(
          bankingTedId,
          code,
          message,
        );
        break;

      case NotifyRegisterBankingTedStatus.TED_FORWARDED:
        await this.adminBankingService.forwardAdminBankingTed(bankingTedId);
        break;

      case NotifyRegisterBankingTedStatus.TED_RECEIVED:
      case NotifyRegisterBankingTedStatus.CONFIRMED:
      case NotifyRegisterBankingTedStatus.ERROR_CONFIRMED:
      case NotifyRegisterBankingTedStatus.IN_PROCESSING:
      case NotifyRegisterBankingTedStatus.ERROR_NOTIFICATION:
        this.logger.debug(
          `Banking TED transaction: ${transactionId} with status: ${status}.`,
        );
        break;
    }
  }
}
