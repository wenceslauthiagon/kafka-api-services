import { Logger } from 'winston';
import { BankTed, BankTedRepository } from '@zro/banking/domain';
import { BankTedEventEmitter } from '@zro/banking/application';

export class SyncBankTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param bankTedRepository BankTed repository.
   * @param eventEmitter Pix key event emitter.
   * @param zroBankTedCode Zro BankTed's default code code.
   */
  constructor(
    private logger: Logger,
    private readonly bankTedRepository: BankTedRepository,
    private readonly eventEmitter: BankTedEventEmitter,
    private readonly zroBankTedCode: string,
  ) {
    this.logger = logger.child({ context: SyncBankTedUseCase.name });
  }

  /**
   * Sync banksTed.
   */
  async execute(downloadedBankTed: BankTed[]): Promise<void> {
    // Data input check
    if (!downloadedBankTed?.length) {
      this.logger.info('No downloaded bank list found.', {
        downloadedBankTed: downloadedBankTed?.length,
      });
      return;
    }

    // Search for banksTed
    const foundBankTeds = await this.bankTedRepository.getAllWithDeletedAt();

    this.logger.debug('Found banksTed.', { banksTed: foundBankTeds.length });

    // Get the bank ISPBs list
    const foundBankTedIspb = foundBankTeds.map((item) => item.ispb);
    const downloadedBankTedIspb = downloadedBankTed.map((item) => item.ispb);

    // Parse new, update and delete bank lists.
    const newBankTeds = downloadedBankTed.filter(
      (bank) => !foundBankTedIspb.includes(bank.ispb),
    );
    const deleteBankTeds = foundBankTeds.filter(
      (bank) => !downloadedBankTedIspb.includes(bank.ispb),
    );
    const updateBankTeds = foundBankTeds.filter((bank) =>
      downloadedBankTedIspb.includes(bank.ispb),
    );

    this.logger.info('Filtered bank lists length.', {
      newBankTeds: newBankTeds.length,
      deleteBankTeds: deleteBankTeds.length,
      updateBankTeds: updateBankTeds.length,
    });

    // Save all repository promises
    const promiseData: Promise<BankTed | number>[] = [];

    // Create new banksTed?
    if (newBankTeds.length) {
      newBankTeds.forEach((bank) => {
        promiseData.push(this.bankTedRepository.create(bank));
        this.eventEmitter.createdBankTed(bank);
      });
      this.logger.debug('BankTed list created.');
    }

    // Delete evicted banksTed?
    if (deleteBankTeds.length) {
      deleteBankTeds.forEach((bank) => {
        // Don't exclude if the bank is zroBankTed
        if (bank.code === this.zroBankTedCode || bank.deletedAt) return;

        promiseData.push(this.bankTedRepository.delete(bank));
        this.eventEmitter.deletedBankTed(bank);
      });
      this.logger.debug('BankTed list deleted.');
    }

    // Update banksTed?
    if (updateBankTeds.length) {
      updateBankTeds.forEach((bank) => {
        const newInfoBankTed = downloadedBankTed.find(
          (item) => item.ispb === bank.ispb,
        );

        // Check if the bank info has the same new info
        if (
          bank.name === newInfoBankTed.name &&
          bank.fullName === newInfoBankTed.fullName &&
          !bank.deletedAt
        )
          return;

        bank.name = newInfoBankTed.name;
        bank.fullName = newInfoBankTed.fullName;
        bank.deletedAt = null;

        promiseData.push(this.bankTedRepository.update(bank));
        this.eventEmitter.updatedBankTed(bank);
      });

      this.logger.debug('BankTed list updated.');
    }

    if (promiseData.length) {
      await Promise.all(promiseData);
    }

    this.logger.debug('BankTed sync list completed.');
  }
}
