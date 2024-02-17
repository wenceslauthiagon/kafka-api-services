import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { PaginationEntity, PaginationOrder } from '@zro/common';
import {
  AddressRepository,
  OccupationRepository,
  OnboardingRepository,
  PersonType,
  User,
  UserLegalRepresentorRepository,
  UserLegalAdditionalInfoRepository,
  UserRepository,
  UserRequestSort,
} from '@zro/users/domain';
import {
  AddressNotFoundException,
  CreateReportUser,
  CreateReportUserLegalRepresentor,
  OnboardingNotFoundException,
  ReportService,
} from '@zro/users/application';

export class SyncUserActiveUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userRepository User repository.
   */
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly addressRepository: AddressRepository,
    private readonly onboardingRepository: OnboardingRepository,
    private readonly userLegalRepresentorRepository: UserLegalRepresentorRepository,
    private readonly occupationRepository: OccupationRepository,
    private readonly userLegalAdditionalInfoRepository: UserLegalAdditionalInfoRepository,
    private readonly reportService: ReportService,
  ) {
    this.logger = logger.child({ context: SyncUserActiveUseCase.name });
  }

  /**
   * Sync users active.
   */
  async execute(): Promise<void> {
    let page = 1;
    const pageSize = 100;
    const pagination = new PaginationEntity({
      page,
      pageSize,
      sort: UserRequestSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    let activeUsersPaginated =
      await this.userRepository.getAllActiveAndBankOnboardingStateIsCompleteUsers(
        pagination,
      );

    this.logger.debug('Found active users.', {
      users: activeUsersPaginated.total,
    });

    while (page <= activeUsersPaginated.pageTotal) {
      for (const user of activeUsersPaginated.data) {
        try {
          if (user.type === PersonType.LEGAL_PERSON) {
            await this.sendLegalUserReport(user);
          }

          await this.sendUserReport(user);
        } catch (error) {
          this.logger.debug('Error with sync active users.', error);

          continue;
        }
      }

      page += 1;

      if (page <= activeUsersPaginated.pageTotal) {
        activeUsersPaginated =
          await this.userRepository.getAllActiveAndBankOnboardingStateIsCompleteUsers(
            { page, ...pagination },
          );
      }
    }
  }

  private async sendUserReport(user: User) {
    const address = await this.addressRepository.getByUser(user);

    this.logger.debug('Address found.', { address });

    if (!address) {
      throw new AddressNotFoundException({ user });
    }

    const onboarding =
      await this.onboardingRepository.getByUserAndStatusIsFinished(user);

    this.logger.debug('Onboarding found.', { address });

    if (!onboarding) {
      throw new OnboardingNotFoundException({ user });
    }

    const data: CreateReportUser = {
      id: uuidv4(),
      uuid: user.uuid,
      fullName: user.fullName || user.name,
      phoneNumber: user.phoneNumber,
      document: user.document,
      deletedAt: user.deletedAt,
      updatedAt: user.updatedAt,
      state: user.state,
      email: user.email,
      type: user.type,
      motherName: user.motherName,
      birthDate: user.birthDate,
      genre: user.genre,
      street: address.street,
      number: address.number,
      city: address.city,
      federativeUnit: address.federativeUnit,
      country: address.country,
      zipCode: address.zipCode,
      complement: address.complement,
      onboardingUpdatedAt: onboarding.updatedAt,
      onboardingReviewAssignee: onboarding.reviewAssignee,
      onboardingPepSince: onboarding.pepSince,
    };

    if (onboarding.occupationCbo) {
      const occupation = await this.occupationRepository.getByCodCbo(
        onboarding.occupationCbo,
      );

      this.logger.debug('Occupation found.', { occupation });

      if (occupation) {
        data.occupationName = occupation.name;
      }
    }

    const userLegalAdditionalInfo =
      await this.userLegalAdditionalInfoRepository.getByUser(user);

    this.logger.debug('User Legal Additional info found.', {
      userLegalAdditionalInfo,
    });

    if (userLegalAdditionalInfo) {
      data.cnae = userLegalAdditionalInfo.cnae;
      data.constitutionDesc = userLegalAdditionalInfo.constitutionDesc;
      data.employeeQty = userLegalAdditionalInfo.employeeQty;
      data.overseasBranchesQty = userLegalAdditionalInfo.overseasBranchesQty;
      data.isThirdPartyRelationship =
        userLegalAdditionalInfo.isThirdPartyRelationship;
      data.isCreditCardAdmin = userLegalAdditionalInfo.isCreditCardAdmin;
      data.isPatrimonyTrust = userLegalAdditionalInfo.isPatrimonyTrust;
      data.isPaymentFacilitator = userLegalAdditionalInfo.isPaymentFacilitator;
      data.isRegulatedPld = userLegalAdditionalInfo.isRegulatedPld;
      data.legalNaturityCode = userLegalAdditionalInfo.legalNaturityCode;
    }

    await this.reportService.createReportUser(data);
  }

  private async sendLegalUserReport(user: User) {
    const usersLegalRepresentors =
      await this.userLegalRepresentorRepository.getAllByUser(user);

    for (const userLegalRepresentor of usersLegalRepresentors) {
      const data: CreateReportUserLegalRepresentor = {
        ...userLegalRepresentor,
        id: uuidv4(),
        user,
        userLegalRepresentorId: userLegalRepresentor.id,
      };

      await this.reportService.createReportUserLegalRepresentor(data);
    }
  }
}
