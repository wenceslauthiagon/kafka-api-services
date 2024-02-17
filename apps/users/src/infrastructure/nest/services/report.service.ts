import { Logger } from 'winston';
import { KafkaService, getMoment } from '@zro/common';
import {
  CreateReportUser,
  CreateReportUserLegalRepresentor,
  ReportService,
} from '@zro/users/application';
import {
  CreateReportUserLegalRepresentorRequest,
  CreateReportUserRequest,
} from '@zro/reports/interface';
import {
  CreateReportUserLegalRepresentorServiceKafka,
  CreateReportUserServiceKafka,
} from '@zro/reports/infrastructure';

export class ReportServiceKafka implements ReportService {
  static _services: any[] = [
    CreateReportUserLegalRepresentorServiceKafka,
    CreateReportUserServiceKafka,
  ];

  private readonly createReportUserService: CreateReportUserServiceKafka;
  private readonly createReportUserLegalRepresentorService: CreateReportUserLegalRepresentorServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: ReportServiceKafka.name });

    this.createReportUserService = new CreateReportUserServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.createReportUserLegalRepresentorService =
      new CreateReportUserLegalRepresentorServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  async createReportUser(data: CreateReportUser): Promise<void> {
    const payload = new CreateReportUserRequest({
      id: data.id,
      userId: data.uuid,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      document: data.document,
      userDeletedAt: data.deletedAt,
      userUpdatedAt: data.updatedAt,
      state: data.state,
      email: data.email,
      type: data.type,
      motherName: data.motherName,
      birthDate: getMoment(data.birthDate).toDate(),
      genre: data.genre,
      addressStreet: data.street,
      addressNumber: data.number,
      addressCity: data.city,
      addressFederativeUnit: data.federativeUnit,
      addressCountry: data.country,
      addressZipCode: data.zipCode,
      addressComplement: data.complement,
      onboardingUpdatedAt: data.onboardingUpdatedAt,
      onboardingReviewAssignee: data.onboardingReviewAssignee,
      onboardingPepSince: data.onboardingPepSince,
      occupationName: data.occupationName,
      cnae: data.cnae,
      constitutionDesc: data.constitutionDesc,
      employeeQty: data.employeeQty,
      overseasBranchesQty: data.overseasBranchesQty,
      isThirdPartyRelationship: data.isThirdPartyRelationship,
      isCreditCardAdmin: data.isCreditCardAdmin,
      isPatrimonyTrust: data.isPatrimonyTrust,
      isPaymentFacilitator: data.isPaymentFacilitator,
      isRegulatedPld: data.isRegulatedPld,
      legalNaturityCode: data.legalNaturityCode,
    });

    await this.createReportUserService.execute(payload);
  }

  async createReportUserLegalRepresentor(
    data: CreateReportUserLegalRepresentor,
  ): Promise<void> {
    const payload = new CreateReportUserLegalRepresentorRequest({
      id: data.id,
      userLegalRepresentorId: data.userLegalRepresentorId,
      personType: data.personType,
      document: data.document,
      name: data.name,
      birthDate: getMoment(data.birthDate).toDate(),
      type: data.type,
      isPublicServer: data.isPublicServer,
      userLegalRepresentorCreatedAt: data.createdAt,
      userLegalRepresentorUpdatedAt: data.updatedAt,
      userId: data.user.uuid,
      userDocument: data.user.document,
      addressZipCode: data.address.zipCode,
      addressStreet: data.address.street,
      addressNumber: data.address.number,
      addressNeighborhood: data.address.neighborhood,
      addressCity: data.address.city,
      addressFederativeUnit: data.address.federativeUnit,
      addressCountry: data.address.country,
      addressComplement: data.address.complement,
    });

    await this.createReportUserLegalRepresentorService.execute(payload);
  }
}
