import { Logger } from 'winston';
import {
  AddressRepository,
  OccupationRepository,
  OnboardingRepository,
  UserLegalRepresentorRepository,
  UserLegalAdditionalInfoRepository,
  UserRepository,
} from '@zro/users/domain';
import {
  ReportService,
  SyncUserActiveUseCase as UseCase,
} from '@zro/users/application';

export class SyncUserActiveController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    addressRepository: AddressRepository,
    onboardingRepository: OnboardingRepository,
    userLegalRepresentorRepository: UserLegalRepresentorRepository,
    occupationRepository: OccupationRepository,
    userLegalAdditionalInfoRepository: UserLegalAdditionalInfoRepository,
    reportService: ReportService,
  ) {
    this.logger = logger.child({ context: SyncUserActiveController.name });

    this.usecase = new UseCase(
      this.logger,
      userRepository,
      addressRepository,
      onboardingRepository,
      userLegalRepresentorRepository,
      occupationRepository,
      userLegalAdditionalInfoRepository,
      reportService,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync user active request.');
    await this.usecase.execute();
  }
}
