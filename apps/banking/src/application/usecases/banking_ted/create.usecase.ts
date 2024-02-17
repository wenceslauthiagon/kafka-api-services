import { Logger } from 'winston';
import {
  MissingDataException,
  isHourInRange,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import {
  BankingTed,
  BankingTedEntity,
  BankingTedRepository,
  BankingTedState,
  BankTedRepository,
} from '@zro/banking/domain';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  BankingTedEventEmitter,
  UserService,
  QuotationService,
  BankingTedIntervalInvalidException,
  BankingTedWeekdayInvalidException,
  BankingTedHolidayInvalidException,
  BankTedNotFoundException,
  BankingTedEvent,
} from '@zro/banking/application';

export class CreateBankingTedUseCase {
  constructor(
    private logger: Logger,
    private readonly bankingTedRepository: BankingTedRepository,
    private readonly bankTedRepository: BankTedRepository,
    private readonly eventEmitter: BankingTedEventEmitter,
    private readonly userService: UserService,
    private readonly quotationService: QuotationService,
    private readonly bankingTedOperationCurrencyTag: string,
    private readonly bankingTedIntervalHour: string,
  ) {
    this.logger = logger.child({ context: CreateBankingTedUseCase.name });
  }

  /**
   * Create banking ted.
   *
   * @param user BankingTed user.
   * @param amount BankingTed amount.
   * @param beneficiaryBankCode BankingTed beneficiaryBankCode.
   * @param beneficiaryName BankingTed beneficiaryName.
   * @param beneficiaryType BankingTed beneficiaryType.
   * @param beneficiaryDocument BankingTed beneficiaryDocument.
   * @param beneficiaryAgency BankingTed beneficiaryAgency.
   * @param beneficiaryAccount BankingTed beneficiaryAccount.
   * @param beneficiaryAccountDigit BankingTed beneficiaryAccountDigit.
   * @param beneficiaryAccountType BankingTed beneficiaryAccountType.
   * @param beneficiaryBankName BankingTed beneficiaryBankName.
   * @returns The created bankingTed.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    user: User,
    wallet: Wallet,
    operation: Operation,
    amount: number,
    beneficiaryBankCode: string,
    beneficiaryName: string,
    beneficiaryType: string,
    beneficiaryDocument: string,
    beneficiaryAgency: string,
    beneficiaryAccount: string,
    beneficiaryAccountDigit: string,
    beneficiaryAccountType: AccountType,
    beneficiaryBankName?: string,
  ): Promise<BankingTed> {
    // Data input check
    if (
      !user?.uuid ||
      !wallet?.uuid ||
      !operation?.id ||
      !amount ||
      !beneficiaryBankCode ||
      !beneficiaryName ||
      !beneficiaryType ||
      !beneficiaryDocument ||
      !beneficiaryAgency ||
      !beneficiaryAccount ||
      !beneficiaryAccountDigit ||
      !beneficiaryAccountType ||
      !this.bankingTedOperationCurrencyTag ||
      !this.bankingTedIntervalHour
    ) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User ID'] : []),
        ...(!wallet?.uuid ? ['Wallet ID'] : []),
        ...(!operation?.id ? ['Operation ID'] : []),
        ...(!amount ? ['Amount'] : []),
        ...(!beneficiaryBankCode ? ['Beneficiary Bank Code'] : []),
        ...(!beneficiaryName ? ['Beneficiary Name'] : []),
        ...(!beneficiaryType ? ['Beneficiary Type'] : []),
        ...(!beneficiaryDocument ? ['Beneficiary Document'] : []),
        ...(!beneficiaryAgency ? ['Beneficiary Bank Agency'] : []),
        ...(!beneficiaryAccount ? ['Beneficiary Bank Account'] : []),
        ...(!beneficiaryAccountDigit ? ['Beneficiary Bank Account Digit'] : []),
        ...(!beneficiaryAccountType ? ['Beneficiary Account Type'] : []),
        ...(!this.bankingTedOperationCurrencyTag ? ['Currency Tag'] : []),
        ...(!this.bankingTedIntervalHour ? ['Ted Interval Hour'] : []),
      ]);
    }

    // Check if bankingTed's operationId is available
    const checkBankingTed =
      await this.bankingTedRepository.getByOperation(operation);

    this.logger.debug('Check if bankingTed operation exists.', {
      ted: checkBankingTed,
    });

    if (checkBankingTed) {
      if (checkBankingTed.user.uuid !== user.uuid) {
        throw new ForbiddenException();
      }
      return checkBankingTed;
    }

    // Search and validate user
    const userFound = await this.userService.getUserByUuid(user);

    this.logger.debug('Found user.', { user: userFound });

    if (!userFound) {
      throw new UserNotFoundException(user);
    }

    Object.assign(user, userFound);

    // Get finished onboarding
    const onboarding =
      await this.userService.getOnboardingByUserAndStatusIsFinished(user);

    this.logger.debug('Found onboarding.', { onboarding });

    if (!onboarding) {
      throw new OnboardingNotFoundException({ user });
    }

    // Check time to do transfer banking ted
    const [startHour, endHour] = this.bankingTedIntervalHour.split(';');
    if (!isHourInRange(startHour, endHour))
      throw new BankingTedIntervalInvalidException(this.bankingTedIntervalHour);

    // Gets current timestamp without minutes and seconds
    const now = getMoment().startOf('hour');

    // Check if today is weekend - Sunday (day 0) or Saturday (day 6).
    if ([0, 6].includes(now.day()))
      throw new BankingTedWeekdayInvalidException(now.toISOString());

    // Check if today is a holiday
    const foundHoliday = await this.quotationService.getHolidayByDate(
      getMoment(now).startOf('day').toDate(),
    );

    this.logger.debug('Found holiday.', { foundHoliday });

    if (foundHoliday) {
      throw new BankingTedHolidayInvalidException(now.toISOString());
    }

    // Check beneficiary bank id exists
    const foundBank =
      await this.bankTedRepository.getByCode(beneficiaryBankCode);

    this.logger.debug('Found bank by code.', { foundBank });

    if (!foundBank) {
      throw new BankTedNotFoundException(foundBank);
    }

    const newBankingTed = new BankingTedEntity({
      user,
      operation,
      beneficiaryBankCode,
      beneficiaryBankName,
      beneficiaryName,
      beneficiaryType,
      beneficiaryDocument,
      beneficiaryAgency,
      beneficiaryAccount,
      beneficiaryAccountDigit,
      beneficiaryAccountType,
      amount,
      state: BankingTedState.PENDING,
    });

    await this.bankingTedRepository.create(newBankingTed);

    // Fire pendingBankingTed
    const event: BankingTedEvent = { ...newBankingTed, wallet };
    this.eventEmitter.pendingBankingTed(event);

    this.logger.debug('Added new banking ted.', { newBankingTed });

    return newBankingTed;
  }
}
