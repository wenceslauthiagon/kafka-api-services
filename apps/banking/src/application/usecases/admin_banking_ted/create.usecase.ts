import { Logger } from 'winston';
import { ForbiddenException } from '@nestjs/common';
import { MissingDataException } from '@zro/common';
import { Admin } from '@zro/admin/domain';
import {
  AdminBankingAccount,
  AdminBankingAccountRepository,
  AdminBankingTed,
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  AdminBankingTedEventEmitter,
  AdminBankingAccountNotFoundException,
  AdminBankingAccountNotActiveException,
  AdminBankingTedBetweenSameAccountException,
} from '@zro/banking/application';

export class CreateAdminBankingTedUseCase {
  constructor(
    private logger: Logger,
    private readonly adminBankingTedRepository: AdminBankingTedRepository,
    private readonly adminBankingAccountRepository: AdminBankingAccountRepository,
    private readonly eventEmitter: AdminBankingTedEventEmitter,
  ) {
    this.logger = logger.child({ context: CreateAdminBankingTedUseCase.name });
  }

  /**
   * Create admin banking ted.
   *
   * @param id adminBankingTed id.
   * @param admin adminBankingTed creator.
   * @param source adminBankingTed source.
   * @param destination adminBankingTed destination.
   * @param description adminBankingTed description.
   * @param value adminBankingTed value.
   * @returns The created adminBankingTed.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {AdminBankingAccountNotFoundException} Thrown when admin banking account not found.
   * @throws {AdminBankingAccountNotActiveException} Thrown when admin banking account not active.
   */
  async execute(
    id: string,
    admin: Admin,
    source: AdminBankingAccount,
    destination: AdminBankingAccount,
    description: string,
    value: number,
  ): Promise<AdminBankingTed> {
    if (
      !id ||
      !admin?.id ||
      !source?.id ||
      !destination?.id ||
      !description ||
      !value
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!admin?.id ? ['Admin ID'] : []),
        ...(!source?.id ? ['Source ID'] : []),
        ...(!destination?.id ? ['Destination ID'] : []),
        ...(!description ? ['Description'] : []),
        ...(!value ? ['Value'] : []),
      ]);
    }

    // Check if admin banking ted ID is available
    const adminBankingTed = await this.adminBankingTedRepository.getById(id);

    this.logger.debug('Check if admin banking ted exists.', {
      ted: adminBankingTed,
    });

    if (adminBankingTed) {
      if (admin.id === adminBankingTed.createdByAdmin.id) {
        return adminBankingTed;
      } else {
        throw new ForbiddenException();
      }
    }

    // Check if source and destionation are same account
    this.logger.debug(
      'Check if source account and destination account are equal.',
      {
        source,
        destination,
      },
    );

    if (source.id === destination.id) {
      throw new AdminBankingTedBetweenSameAccountException({
        source,
        destination,
      });
    }

    // Search and validate source account
    const sourceAccountFound = await this.adminBankingAccountRepository.getById(
      source.id,
    );

    this.logger.debug('Found source account.', { account: sourceAccountFound });

    if (!sourceAccountFound) {
      throw new AdminBankingAccountNotFoundException(source);
    }

    if (!sourceAccountFound.isActive()) {
      throw new AdminBankingAccountNotActiveException(sourceAccountFound);
    }

    Object.assign(source, sourceAccountFound);

    // Search and validate destination account
    const destinationAccountFound =
      await this.adminBankingAccountRepository.getById(destination.id);

    this.logger.debug('Found destination account.', {
      account: destinationAccountFound,
    });

    if (!destinationAccountFound) {
      throw new AdminBankingAccountNotFoundException(destination);
    }

    if (!destinationAccountFound.isActive()) {
      throw new AdminBankingAccountNotActiveException(destinationAccountFound);
    }

    Object.assign(destination, destinationAccountFound);

    const newAdminBankingTed = new AdminBankingTedEntity({
      id,
      source,
      destination,
      state: AdminBankingTedState.PENDING,
      description,
      value,
      createdByAdmin: admin,
      updatedByAdmin: admin,
    });

    await this.adminBankingTedRepository.create(newAdminBankingTed);

    // Fire pendingAdminBankingTed
    this.eventEmitter.pendingAdminBankingTed(newAdminBankingTed);

    this.logger.debug('Added new admin banking ted.', {
      ted: newAdminBankingTed,
    });

    return newAdminBankingTed;
  }
}
