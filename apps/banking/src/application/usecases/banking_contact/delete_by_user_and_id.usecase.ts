import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  BankingAccountContact,
  BankingContactRepository,
  BankingAccountContactRepository,
} from '@zro/banking/domain';
import { BankingAccountContactNotFoundException } from '@zro/banking/application';
import { User } from '@zro/users/domain';

export class DeleteBankingContactByIdUseCase {
  constructor(
    private logger: Logger,
    private bankingContactRepository: BankingContactRepository,
    private bankingAccountContactRepository: BankingAccountContactRepository,
  ) {
    this.logger = logger.child({
      context: DeleteBankingContactByIdUseCase.name,
    });
  }

  /**
   * Delete bankingContact by user and id.
   *
   * @param bankingAccountContactId BankingAccountContact id.
   * @param user user.
   * @returns void.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    bankingAccountContactId: BankingAccountContact['id'],
    user: User,
  ): Promise<void> {
    if (!user?.id || !bankingAccountContactId) {
      throw new MissingDataException([
        ...(!user?.id ? ['User ID'] : []),
        ...(!bankingAccountContactId ? ['Banking Account Contact ID'] : []),
      ]);
    }

    // Search bankingAccountContact
    const bankingAccountContact =
      await this.bankingAccountContactRepository.getById(
        bankingAccountContactId,
      );

    this.logger.debug('BankingAccountContact found.', {
      bankingAccountContact,
    });

    if (!bankingAccountContact) {
      throw new BankingAccountContactNotFoundException({
        id: bankingAccountContactId,
      });
    }

    await this.bankingAccountContactRepository.delete(bankingAccountContact);

    this.logger.debug('Banking account contact deleted.', {
      bankingAccountContact,
    });

    // Delete bankingContact if no more bankingAccountContact

    const bankingContact = bankingAccountContact.bankingContact;

    const bankingAccountContacts =
      await this.bankingAccountContactRepository.getByBankingContact(
        bankingContact,
      );

    this.logger.debug('BankingAccountContacts found.', {
      bankingAccountContacts,
    });

    if (!bankingAccountContacts.length) {
      await this.bankingContactRepository.delete(bankingContact);

      this.logger.debug('Banking contact deleted.', { bankingContact });
    }
  }
}
