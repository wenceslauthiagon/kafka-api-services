import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { TransactionTypeEntity } from '@zro/operations/domain';
import { ReportOperationEntity } from '@zro/reports/domain';
import { TransactionTypeNotFoundException } from '@zro/operations/application';
import {
  CreateReportOperationByGatewayMicroserviceController as Controller,
  OperationServiceKafka,
  ReportOperationDatabaseRepository,
  UserServiceKafka,
} from '@zro/reports/infrastructure';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { CreateReportOperationByGatewayRequest } from '@zro/reports/interface';
import { ReportOperationFactory } from '@zro/test/reports/config';
import { TransactionTypeFactory } from '@zro/test/operations/config';

describe('CreateReportOperationByGatewayMicroserviceController', () => {
  beforeEach(() => jest.resetAllMocks());

  let module: TestingModule;
  let controller: Controller;
  let reportOperationRepository: ReportOperationDatabaseRepository;

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getTransactionTypeByTag),
  );
  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByDocument),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    reportOperationRepository = new ReportOperationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateReportOperationByGateway', () => {
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

        const transactionTypeFound =
          await TransactionTypeFactory.create<TransactionTypeEntity>(
            TransactionTypeEntity.name,
          );

        mockGetOperationService.mockResolvedValue(transactionTypeFound);
        mockGetUserService.mockResolvedValue(client);

        const message: CreateReportOperationByGatewayRequest = {
          id,
          operationId: operation.id,
          operationDate: operation.createdAt,
          operationValue: operation.value,
          operationType,
          transactionTypeTag: transactionType.tag,
          thirdPartName: thirdPart.name,
          thirdPartDocument: thirdPart.document,
          thirdPartDocumentType: thirdPart.type,
          thirdPartBankCode,
          thirdPartBranch,
          thirdPartAccountNumber,
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
          operationService,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(mockGetOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetUserService).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should dont create report operation when transaction tag not found', async () => {
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

        mockGetOperationService.mockResolvedValue(undefined);

        const message: CreateReportOperationByGatewayRequest = {
          id,
          operationId: operation.id,
          operationDate: operation.createdAt,
          operationValue: operation.value,
          operationType,
          transactionTypeTag: transactionType.tag,
          thirdPartName: thirdPart.name,
          thirdPartDocument: thirdPart.document,
          thirdPartDocumentType: thirdPart.type,
          thirdPartBankCode,
          thirdPartBranch,
          thirdPartAccountNumber,
          clientName: client.name,
          clientDocument: client.document,
          clientDocumentType: client.type,
          clientBankCode,
          clientBranch,
          clientAccountNumber,
          currencySymbol: currency.symbol,
        };

        const testScript = () =>
          controller.execute(
            reportOperationRepository,
            operationService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          TransactionTypeNotFoundException,
        );
        expect(mockGetOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetUserService).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
