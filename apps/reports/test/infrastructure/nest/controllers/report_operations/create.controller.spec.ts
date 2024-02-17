import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { ReportOperationEntity } from '@zro/reports/domain';
import {
  CreateReportOperationMicroserviceController as Controller,
  ReportOperationDatabaseRepository,
} from '@zro/reports/infrastructure';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { CreateReportOperationRequest } from '@zro/reports/interface';
import { ReportOperationFactory } from '@zro/test/reports/config';

describe('CreateReportOperationMicroserviceController', () => {
  beforeEach(() => jest.resetAllMocks());

  let module: TestingModule;
  let controller: Controller;
  let reportOperationRepository: ReportOperationDatabaseRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    reportOperationRepository = new ReportOperationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateReportOperation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create report operation successfully', async () => {
        const {
          id,
          operation,
          operationType,
          transactionType,
          thirdPart,
          thirdPartBankCode,
          thirdPartBranch,
          thirdPartAccountNumber,
          client,
          clientBankCode,
          clientBranch,
          clientAccountNumber,
          currency,
        } = await ReportOperationFactory.create<ReportOperationEntity>(
          ReportOperationEntity.name,
        );

        const message: CreateReportOperationRequest = {
          id,
          operationId: operation.id,
          operationDate: operation.createdAt,
          operationValue: operation.value,
          operationType,
          transactionTypeId: transactionType.id,
          transactionTypeTitle: transactionType.title,
          transactionTypeTag: transactionType.tag,
          thirdPartName: thirdPart.name,
          thirdPartDocument: thirdPart.document,
          thirdPartDocumentType: thirdPart.type,
          thirdPartBankCode,
          thirdPartBranch,
          thirdPartAccountNumber,
          clientId: client.uuid,
          clientName: client.name,
          clientDocument: client.document,
          clientDocumentType: client.type,
          clientBankCode,
          clientBranch,
          clientAccountNumber,
          currencySymbol: currency.symbol,
        };

        const result = await controller.execute(
          reportOperationRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.operationId).toBe(operation.id);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
