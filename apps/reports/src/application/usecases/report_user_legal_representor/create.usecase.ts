import { Logger } from 'winston';
import { isBoolean } from 'class-validator';
import { MissingDataException } from '@zro/common';
import { UserLegalRepresentor } from '@zro/users/domain';
import {
  ReportUserLegalRepresentor,
  ReportUserLegalRepresentorEntity,
  ReportUserLegalRepresentorRepository,
} from '@zro/reports/domain';

export class CreateReportUserLegalRepresentorUseCase {
  constructor(
    private logger: Logger,
    private readonly reportUserLegalRepresentorRepository: ReportUserLegalRepresentorRepository,
  ) {
    this.logger = logger.child({
      context: CreateReportUserLegalRepresentorUseCase.name,
    });
  }

  async execute(
    id: string,
    userLegalRepresentor: UserLegalRepresentor,
  ): Promise<ReportUserLegalRepresentor> {
    if (
      !id ||
      !userLegalRepresentor?.id ||
      !userLegalRepresentor?.personType ||
      !userLegalRepresentor?.document ||
      !userLegalRepresentor?.name ||
      !userLegalRepresentor?.birthDate ||
      !userLegalRepresentor?.type ||
      !isBoolean(userLegalRepresentor?.isPublicServer) ||
      !userLegalRepresentor?.createdAt ||
      !userLegalRepresentor?.updatedAt ||
      !userLegalRepresentor?.user?.uuid ||
      !userLegalRepresentor?.user?.document ||
      !userLegalRepresentor?.address?.zipCode ||
      !userLegalRepresentor?.address?.street ||
      !userLegalRepresentor?.address?.number ||
      !userLegalRepresentor?.address?.neighborhood ||
      !userLegalRepresentor?.address?.city ||
      !userLegalRepresentor?.address?.federativeUnit
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!userLegalRepresentor?.id ? ['UserLegalRepresentor ID'] : []),
        ...(!userLegalRepresentor?.personType
          ? ['UserLegalRepresentor Person Type']
          : []),
        ...(!userLegalRepresentor?.document
          ? ['UserLegalRepresentor Document']
          : []),
        ...(!userLegalRepresentor?.name ? ['UserLegalRepresentor Name'] : []),
        ...(!userLegalRepresentor?.birthDate
          ? ['UserLegalRepresentor BirthDate']
          : []),
        ...(!userLegalRepresentor?.type ? ['UserLegalRepresentor Type'] : []),
        ...(!isBoolean(userLegalRepresentor?.isPublicServer)
          ? ['UserLegalRepresentor IsPublicServer']
          : []),
        ...(!userLegalRepresentor?.createdAt
          ? ['UserLegalRepresentor CreatedAt']
          : []),
        ...(!userLegalRepresentor?.updatedAt
          ? ['UserLegalRepresentor UpdatedAt']
          : []),
        ...(!userLegalRepresentor?.user?.uuid
          ? ['UserLegalRepresentor User UUID']
          : []),
        ...(!userLegalRepresentor?.user?.document
          ? ['UserLegalRepresentor User Document']
          : []),
        ...(!userLegalRepresentor?.address?.zipCode
          ? ['UserLegalRepresentor Address ZipCode']
          : []),
        ...(!userLegalRepresentor?.address?.street
          ? ['UserLegalRepresentor Address Street']
          : []),
        ...(!userLegalRepresentor?.address?.number
          ? ['UserLegalRepresentor Address Number']
          : []),
        ...(!userLegalRepresentor?.address?.neighborhood
          ? ['UserLegalRepresentor Address Neighborhood']
          : []),
        ...(!userLegalRepresentor?.address?.city
          ? ['UserLegalRepresentor Address City']
          : []),
        ...(!userLegalRepresentor?.address?.federativeUnit
          ? ['UserLegalRepresentor Address Federative Unit']
          : []),
      ]);
    }

    const reportUserLegalRepresentorWithSameIdFound =
      await this.reportUserLegalRepresentorRepository.getById(id);

    if (reportUserLegalRepresentorWithSameIdFound) {
      return reportUserLegalRepresentorWithSameIdFound;
    }

    const reportUserLegalRepresentorFound =
      await this.reportUserLegalRepresentorRepository.getByUserLegalRepresentor(
        userLegalRepresentor,
      );

    this.logger.debug('Check if report UserLegalRepresentor exists.', {
      reportUserLegalRepresentorFound,
    });

    if (reportUserLegalRepresentorFound) {
      return this.updateReportUserLegalRepresentor(
        reportUserLegalRepresentorFound,
        userLegalRepresentor,
      );
    }

    return this.createReportUserLegalRepresentor(id, userLegalRepresentor);
  }

  private async updateReportUserLegalRepresentor(
    reportUserLegalRepresentorFound: ReportUserLegalRepresentor,
    userLegalRepresentor: UserLegalRepresentor,
  ): Promise<ReportUserLegalRepresentor> {
    const reportUserLegalRepresentor = new ReportUserLegalRepresentorEntity({
      ...reportUserLegalRepresentorFound,
      userLegalRepresentor,
    });

    const reportUserLegalRepresentorUpdated =
      await this.reportUserLegalRepresentorRepository.update(
        reportUserLegalRepresentor,
      );

    return reportUserLegalRepresentorUpdated;
  }

  private async createReportUserLegalRepresentor(
    id: string,
    userLegalRepresentor: UserLegalRepresentor,
  ): Promise<ReportUserLegalRepresentor> {
    const reportUserLegalRepresentor = new ReportUserLegalRepresentorEntity({
      id,
      userLegalRepresentor,
    });

    const reportUserLegalRepresentorCreated =
      await this.reportUserLegalRepresentorRepository.create(
        reportUserLegalRepresentor,
      );

    return reportUserLegalRepresentorCreated;
  }
}
