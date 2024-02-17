import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import {
  CreateReportUserLegalRepresentorMicroserviceController as Controller,
  ReportUserLegalRepresentorDatabaseRepository,
  ReportUserLegalRepresentorModel,
} from '@zro/reports/infrastructure';
import { ReportUserLegalRepresentorFactory } from '@zro/test/reports/config';
import { ReportUserLegalRepresentorEntity } from '@zro/reports/domain';
import { KafkaContext } from '@nestjs/microservices';
import { CreateReportUserLegalRepresentorRequest } from '@zro/reports/interface';

describe('CreateReportUserLegalRepresentorMicroserviceController', () => {
  beforeEach(() => jest.resetAllMocks());

  let module: TestingModule;
  let controller: Controller;
  let reportUserLegalRepresentorRepository: ReportUserLegalRepresentorDatabaseRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    reportUserLegalRepresentorRepository =
      new ReportUserLegalRepresentorDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateReportUserLegalRepresentor', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - should throw if missing params', async () => {
        const message: CreateReportUserLegalRepresentorRequest = {
          id: null,
          userLegalRepresentorId: null,
          personType: null,
          document: null,
          name: null,
          birthDate: null,
          type: null,
          isPublicServer: null,
          userLegalRepresentorCreatedAt: null,
          userLegalRepresentorUpdatedAt: null,
          userId: null,
          userDocument: null,
          addressZipCode: null,
          addressStreet: null,
          addressNumber: null,
          addressNeighborhood: null,
          addressCity: null,
          addressFederativeUnit: null,
          addressCountry: null,
          addressComplement: null,
        };

        const testScript = () =>
          controller.execute(
            reportUserLegalRepresentorRepository,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should update report user successfully', async () => {
        const reportUserLegalRepresentor = (
          await ReportUserLegalRepresentorFactory.create<ReportUserLegalRepresentorModel>(
            ReportUserLegalRepresentorModel.name,
          )
        ).toDomain();

        const message: CreateReportUserLegalRepresentorRequest = {
          id: reportUserLegalRepresentor.id,
          userLegalRepresentorId:
            reportUserLegalRepresentor.userLegalRepresentor.id,
          personType:
            reportUserLegalRepresentor.userLegalRepresentor.personType,
          document: reportUserLegalRepresentor.userLegalRepresentor.document,
          name: reportUserLegalRepresentor.userLegalRepresentor.name,
          birthDate: reportUserLegalRepresentor.userLegalRepresentor.birthDate,
          type: reportUserLegalRepresentor.userLegalRepresentor.type,
          isPublicServer:
            reportUserLegalRepresentor.userLegalRepresentor.isPublicServer,
          userLegalRepresentorCreatedAt:
            reportUserLegalRepresentor.userLegalRepresentor.createdAt,
          userLegalRepresentorUpdatedAt:
            reportUserLegalRepresentor.userLegalRepresentor.updatedAt,
          userId: reportUserLegalRepresentor.userLegalRepresentor.user.uuid,
          userDocument:
            reportUserLegalRepresentor.userLegalRepresentor.user.document,
          addressZipCode:
            reportUserLegalRepresentor.userLegalRepresentor.address.zipCode,
          addressStreet:
            reportUserLegalRepresentor.userLegalRepresentor.address.street,
          addressNumber:
            reportUserLegalRepresentor.userLegalRepresentor.address.number,
          addressNeighborhood:
            reportUserLegalRepresentor.userLegalRepresentor.address
              .neighborhood,
          addressCity:
            reportUserLegalRepresentor.userLegalRepresentor.address.city,
          addressFederativeUnit:
            reportUserLegalRepresentor.userLegalRepresentor.address
              .federativeUnit,
          addressCountry:
            reportUserLegalRepresentor.userLegalRepresentor.address.country,
          addressComplement:
            reportUserLegalRepresentor.userLegalRepresentor.address.complement,
        };

        const result = await controller.execute(
          reportUserLegalRepresentorRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
      });

      it('TC0003 - Should create report user successfully', async () => {
        const reportUserLegalRepresentor =
          await ReportUserLegalRepresentorFactory.create<ReportUserLegalRepresentorEntity>(
            ReportUserLegalRepresentorEntity.name,
          );

        const message: CreateReportUserLegalRepresentorRequest = {
          id: reportUserLegalRepresentor.id,
          userLegalRepresentorId:
            reportUserLegalRepresentor.userLegalRepresentor.id,
          personType:
            reportUserLegalRepresentor.userLegalRepresentor.personType,
          document: reportUserLegalRepresentor.userLegalRepresentor.document,
          name: reportUserLegalRepresentor.userLegalRepresentor.name,
          birthDate: reportUserLegalRepresentor.userLegalRepresentor.birthDate,
          type: reportUserLegalRepresentor.userLegalRepresentor.type,
          isPublicServer:
            reportUserLegalRepresentor.userLegalRepresentor.isPublicServer,
          userLegalRepresentorCreatedAt:
            reportUserLegalRepresentor.userLegalRepresentor.createdAt,
          userLegalRepresentorUpdatedAt:
            reportUserLegalRepresentor.userLegalRepresentor.updatedAt,
          userId: reportUserLegalRepresentor.userLegalRepresentor.user.uuid,
          userDocument:
            reportUserLegalRepresentor.userLegalRepresentor.user.document,
          addressZipCode:
            reportUserLegalRepresentor.userLegalRepresentor.address.zipCode,
          addressStreet:
            reportUserLegalRepresentor.userLegalRepresentor.address.street,
          addressNumber:
            reportUserLegalRepresentor.userLegalRepresentor.address.number,
          addressNeighborhood:
            reportUserLegalRepresentor.userLegalRepresentor.address
              .neighborhood,
          addressCity:
            reportUserLegalRepresentor.userLegalRepresentor.address.city,
          addressFederativeUnit:
            reportUserLegalRepresentor.userLegalRepresentor.address
              .federativeUnit,
          addressCountry:
            reportUserLegalRepresentor.userLegalRepresentor.address.country,
          addressComplement:
            reportUserLegalRepresentor.userLegalRepresentor.address.complement,
        };

        const result = await controller.execute(
          reportUserLegalRepresentorRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
