import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  BankingTedEventEmitter,
  BankingTedNotFoundException,
  BankingTedInvalidStateException,
  BankingTedInvalidConfirmationException,
} from '@zro/banking/application';
import {
  BankingTed,
  BankingTedEntity,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';

export class ConfirmBankingTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param bankingTedRepository bankingTed repository.
   * @param eventEmitter bankingTed event emitter.
   * @param operationService Operation service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly bankingTedRepository: BankingTedRepository,
    private readonly eventEmitter: BankingTedEventEmitter,
  ) {
    this.logger = logger.child({
      context: ConfirmBankingTedUseCase.name,
    });
  }

  async execute(payload: BankingTedEntity): Promise<BankingTed> {
    if (
      !payload?.transactionId ||
      !payload?.beneficiaryDocument ||
      !payload?.beneficiaryBankCode ||
      !payload?.beneficiaryAgency ||
      !payload?.beneficiaryAccount ||
      !payload?.beneficiaryAccountType ||
      !payload?.amount
    )
      throw new MissingDataException([
        ...(!payload?.transactionId ? ['Beneficiary Document'] : []),
        ...(!payload?.beneficiaryDocument ? ['Beneficiary Document'] : []),
        ...(!payload?.beneficiaryBankCode ? ['Beneficiary BankCode'] : []),
        ...(!payload?.beneficiaryAgency ? ['Beneficiary Agency'] : []),
        ...(!payload?.beneficiaryAccount ? ['Beneficiary Account'] : []),
        ...(!payload?.beneficiaryAccountType
          ? ['Beneficiary Account Type']
          : []),
        ...(!payload?.amount ? ['Amount'] : []),
      ]);

    // Search bankingTed
    const bankingTed = await this.bankingTedRepository.getByTransactionId(
      payload.transactionId,
    );

    this.logger.debug('Found bankingTed.', { bankingTed });

    if (
      !bankingTed?.beneficiaryDocument ||
      !bankingTed?.beneficiaryAccount ||
      !bankingTed?.beneficiaryBankCode ||
      !bankingTed?.beneficiaryAgency ||
      !bankingTed?.beneficiaryAccountType ||
      !bankingTed?.amount
    ) {
      throw new BankingTedNotFoundException({
        transactionId: payload.transactionId,
      });
    }

    // Indepotent
    if (bankingTed.isAlreadyConfirmedBankingTed()) {
      return bankingTed;
    }

    // Only WAITING bankingTed is accept.
    if (bankingTed.state !== BankingTedState.WAITING) {
      throw new BankingTedInvalidStateException(bankingTed);
    }

    this.validateTedInfo(bankingTed, payload);

    // bankingTed is confirmed.
    bankingTed.state = BankingTedState.CONFIRMED;
    bankingTed.confirmedAt = new Date();

    // Update bankingTed
    await this.bankingTedRepository.update(bankingTed);

    // Fire Confirmed BankingTed
    this.eventEmitter.confirmedBankingTed(bankingTed);

    this.logger.debug('Updated bankingTed with confirmed status.', {
      bankingTed,
    });

    return bankingTed;
  }

  private validateTedInfo(bankingTedFound: BankingTed, payload: BankingTed) {
    const accountNumber = `${bankingTedFound.beneficiaryAccount}${bankingTedFound.beneficiaryAccountDigit}`;

    if (
      bankingTedFound.beneficiaryDocument !== payload.beneficiaryDocument ||
      String(bankingTedFound.beneficiaryBankCode).padStart(3, '0') !==
        String(payload.beneficiaryBankCode).padStart(3, '0') ||
      bankingTedFound.beneficiaryAgency.padStart(4, '0') !==
        payload.beneficiaryAgency.padStart(4, '0') ||
      accountNumber !== payload.beneficiaryAccount ||
      bankingTedFound.beneficiaryAccountType.toLowerCase() !==
        payload.beneficiaryAccountType.toLowerCase() ||
      bankingTedFound.amount !== payload.amount
    ) {
      throw new BankingTedInvalidConfirmationException({
        transactionId: payload.transactionId,
      });
    }
  }
}
