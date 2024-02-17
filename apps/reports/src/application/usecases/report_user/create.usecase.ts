import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  Address,
  Occupation,
  Onboarding,
  User,
  UserLegalAdditionalInfo,
} from '@zro/users/domain';
import {
  ReportUser,
  ReportUserEntity,
  ReportUserRepository,
} from '@zro/reports/domain';
import { AdminEntity } from '@zro/admin/domain';
import { UserLimit, UserLimitEntity } from '@zro/operations/domain';
import { AdminService, OperationService } from '@zro/reports/application';

export class CreateReportUserUseCase {
  constructor(
    private logger: Logger,
    private readonly reportUserRepository: ReportUserRepository,
    private readonly adminService: AdminService,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({ context: CreateReportUserUseCase.name });
  }

  async execute(
    id: string,
    user: User,
    address: Address,
    onboarding: Onboarding,
    occupation: Occupation,
    userLegalAdditionalInfo: UserLegalAdditionalInfo,
  ): Promise<ReportUser> {
    if (
      !id ||
      !user?.uuid ||
      !user?.phoneNumber ||
      !user?.document ||
      !user?.updatedAt ||
      !user?.state ||
      !user?.type ||
      !address?.city ||
      !address?.federativeUnit ||
      !onboarding?.updatedAt
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User ID'] : []),
        ...(!user?.phoneNumber ? ['User phone number'] : []),
        ...(!user?.document ? ['User document'] : []),
        ...(!user?.updatedAt ? ['User updatedAt'] : []),
        ...(!user?.state ? ['User state'] : []),
        ...(!user?.type ? ['User Type'] : []),
        ...(!address?.city ? ['Address city'] : []),
        ...(!address?.federativeUnit ? ['Address federative unit'] : []),
        ...(!onboarding?.updatedAt ? ['Onboarding updatedAt'] : []),
      ]);
    }

    const reportUserWithSameIdFound =
      await this.reportUserRepository.getById(id);

    if (reportUserWithSameIdFound) {
      return reportUserWithSameIdFound;
    }

    const reportUserFound = await this.reportUserRepository.getByUser(user);

    this.logger.debug('Check if report user exists.', { reportUserFound });

    if (reportUserFound) {
      return this.updateReportUser(
        reportUserFound,
        user,
        address,
        onboarding,
        occupation,
        userLegalAdditionalInfo,
      );
    }

    return this.createReportUser(
      id,
      user,
      address,
      onboarding,
      occupation,
      userLegalAdditionalInfo,
    );
  }

  private async getBiggestUserLimit(user: User): Promise<UserLimit> {
    const userLimits = await this.operationService.getAllUserLimits(user);

    const biggestUserLimit = userLimits.reduce(
      (acc, att) => {
        if (att.dailyLimit > acc.dailyLimit) {
          return att;
        }

        return acc;
      },
      new UserLimitEntity({ dailyLimit: 0 }),
    );

    return biggestUserLimit;
  }

  private async updateReportUser(
    reportUserFound: ReportUser,
    user: User,
    address: Address,
    onboarding: Onboarding,
    occupation: Occupation,
    userLegalAdditionalInfo: UserLegalAdditionalInfo,
  ): Promise<ReportUser> {
    const userLimit = await this.getBiggestUserLimit(user);

    const admin = onboarding.reviewAssignee
      ? await this.adminService.getById(onboarding.reviewAssignee)
      : new AdminEntity({ name: 'Automático' });

    const reportUser = new ReportUserEntity({
      ...reportUserFound,
      user,
      address,
      onboarding,
      admin,
      userLimit,
      occupation,
      userLegalAdditionalInfo,
    });

    const reportUserUpdated =
      await this.reportUserRepository.update(reportUser);

    return reportUserUpdated;
  }

  private async createReportUser(
    id: string,
    user: User,
    address: Address,
    onboarding: Onboarding,
    occupation: Occupation,
    userLegalAdditionalInfo: UserLegalAdditionalInfo,
  ): Promise<ReportUser> {
    const userLimit = await this.getBiggestUserLimit(user);

    const admin = onboarding.reviewAssignee
      ? await this.adminService.getById(onboarding.reviewAssignee)
      : new AdminEntity({ name: 'Automático' });

    const reportUser = new ReportUserEntity({
      id,
      user,
      address,
      onboarding,
      admin,
      userLimit,
      occupation,
      userLegalAdditionalInfo,
    });

    const reportUserCreated =
      await this.reportUserRepository.create(reportUser);

    return reportUserCreated;
  }
}
