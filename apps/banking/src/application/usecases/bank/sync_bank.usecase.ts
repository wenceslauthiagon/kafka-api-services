import { Logger } from 'winston';
import { Bank, BankRepository } from '@zro/banking/domain';
import { BankEventEmitter } from '@zro/banking/application';

export class SyncBankUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param bankRepository Bank repository.
   * @param eventEmitter Pix key event emitter.
   * @param zroBankIspb Zro Bank's default ispb code.
   */
  constructor(
    private logger: Logger,
    private readonly bankRepository: BankRepository,
    private readonly eventEmitter: BankEventEmitter,
    private readonly zroBankIspb: string,
  ) {
    this.logger = logger.child({ context: SyncBankUseCase.name });
  }

  /**
   * Sync banks.
   */
  async execute(downloadedBank: Bank[]): Promise<void> {
    // Data input check
    if (!downloadedBank?.length) {
      this.logger.info('No downloaded bank list found.', {
        downloadedBank: downloadedBank?.length,
      });
      return;
    }

    // Search for banks
    const foundBanks = await this.bankRepository.getAllWithDeletedAt();

    this.logger.debug('Found banks.', { banks: foundBanks.length });

    // Get the bank ISPBs list
    const foundBankIspb = foundBanks.map((item) => item.ispb);
    const downloadedBankIspb = downloadedBank.map((item) => item.ispb);

    // Parse new, update and delete bank lists.
    const newBanks = downloadedBank.filter(
      (bank) => !foundBankIspb.includes(bank.ispb),
    );
    const deleteBanks = foundBanks.filter(
      (bank) => !downloadedBankIspb.includes(bank.ispb),
    );
    const updateBanks = foundBanks.filter((bank) =>
      downloadedBankIspb.includes(bank.ispb),
    );

    this.logger.info('Filtered bank lists length.', {
      newBanks: newBanks.length,
      deleteBanks: deleteBanks.length,
      updateBanks: updateBanks.length,
    });

    // Save all repository promises
    const promiseData: Promise<Bank | number>[] = [];

    // Create new banks?
    if (newBanks.length) {
      newBanks.forEach((bank) => {
        promiseData.push(this.bankRepository.create(bank));
        this.eventEmitter.createdBank(bank);
      });
      this.logger.debug('Bank list created.');
    }

    // Delete evicted banks?
    if (deleteBanks.length) {
      deleteBanks.forEach((bank) => {
        // Don't exclude if the bank is zroBank
        if (bank.ispb === this.zroBankIspb || bank.deletedAt) return;

        promiseData.push(this.bankRepository.delete(bank));
        this.eventEmitter.deletedBank(bank);
      });
      this.logger.debug('Bank list deleted.');
    }

    // Update banks?
    if (updateBanks.length) {
      updateBanks.forEach((bank) => {
        const newInfoBank = downloadedBank.find(
          (item) => item.ispb === bank.ispb,
        );

        // Check if the bank info has the same new info
        if (
          bank.name === newInfoBank.name &&
          bank.fullName === newInfoBank.fullName &&
          !bank.deletedAt
        )
          return;

        bank.name = newInfoBank.name;
        bank.fullName = newInfoBank.fullName;
        bank.deletedAt = null;

        promiseData.push(this.bankRepository.update(bank));
        this.eventEmitter.updatedBank(bank);
      });

      this.logger.debug('Bank list updated.');
    }

    if (promiseData.length) {
      await Promise.all(promiseData);
    }

    this.logger.debug('Bank sync list completed.');
  }
}
