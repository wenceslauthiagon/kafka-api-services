import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import {
  ReportPixDepositNestObserver as Observer,
  OperationServiceKafka,
  ReportOperationDatabaseRepository,
} from '@zro/reports/infrastructure';
import { PixDepositEntity } from '@zro/pix-payments/domain';
import {
  CurrencyEntity,
  OperationEntity,
  TransactionTypeEntity,
} from '@zro/operations/domain';
import {
  CurrencyFactory,
  OperationFactory,
  TransactionTypeFactory,
} from '@zro/test/operations/config';
import { PixDepositFactory } from '@zro/test/pix-payments/config';
import { HandleCreateReportOperationByPixDepositReceivedEventRequest } from '@zro/reports/interface';

describe('ReportPixDepositNestObserver', () => {
  beforeEach(() => jest.resetAllMocks());

  let module: TestingModule;
  let controller: Observer;
  let reportOperationRepository: ReportOperationDatabaseRepository;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetTransactionTypeByTagService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.getTransactionTypeByTag));
  const mockGetCurrencyByTagService: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyByTag),
  );
  const mockGetOperationByIdService: jest.Mock = On(operationService).get(
    method((mock) => mock.getOperationById),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Observer>(Observer);
    reportOperationRepository = new ReportOperationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleDepositReceivedEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create report successfully', async () => {
        const depositEmitted = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
        );

        const transactionTypeFound =
          await TransactionTypeFactory.create<TransactionTypeEntity>(
            TransactionTypeEntity.name,
          );

        const operationFound = await OperationFactory.create<OperationEntity>(
          OperationEntity.name,
        );

        const currencyFound = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );

        mockGetTransactionTypeByTagService.mockResolvedValue(
          transactionTypeFound,
        );
        mockGetOperationByIdService.mockResolvedValue(operationFound);
        mockGetCurrencyByTagService.mockResolvedValue(currencyFound);

        const message: HandleCreateReportOperationByPixDepositReceivedEventRequest =
          {
            id: depositEmitted.id,
            userId: depositEmitted.user.uuid,
            operationId: depositEmitted.operation.id,
            transactionTag: depositEmitted.transactionTag,
            thirdPartName: depositEmitted.thirdPartName,
            thirdPartDocument: depositEmitted.thirdPartDocument,
            thirdPartBankIspb: depositEmitted.thirdPartBank.ispb,
            thirdPartBranch: depositEmitted.thirdPartBranch,
            thirdPartAccountNumber: depositEmitted.thirdPartAccountNumber,
            clientName: depositEmitted.clientName,
            clientDocument: depositEmitted.clientDocument,
            clientBranch: depositEmitted.clientBranch,
            clientAccountNumber: depositEmitted.clientAccountNumber,
          };

        const result = await controller.handleDepositReceivedEvent(
          message,
          reportOperationRepository,
          operationService,
          logger,
          ctx,
        );

        expect(result).toBeUndefined();
        expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
        expect(mockGetOperationByIdService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyByTagService).toHaveBeenCalledTimes(1);
      });

      describe('With invalid parameters', () => {
        it('TC0002 - should dont create report operation when transaction tag not found', async () => {
          const depositEmitted =
            await PixDepositFactory.create<PixDepositEntity>(
              PixDepositEntity.name,
            );

          mockGetTransactionTypeByTagService.mockResolvedValue(undefined);

          const message: HandleCreateReportOperationByPixDepositReceivedEventRequest =
            {
              id: depositEmitted.id,
              userId: depositEmitted.user.uuid,
              operationId: depositEmitted.operation.id,
              transactionTag: depositEmitted.transactionTag,
              thirdPartName: depositEmitted.thirdPartName,
              thirdPartDocument: depositEmitted.thirdPartDocument,
              thirdPartBankIspb: depositEmitted.thirdPartBank.ispb,
              thirdPartBranch: depositEmitted.thirdPartBranch,
              thirdPartAccountNumber: depositEmitted.thirdPartAccountNumber,
              clientName: depositEmitted.clientName,
              clientDocument: depositEmitted.clientDocument,
              clientBranch: depositEmitted.clientBranch,
              clientAccountNumber: depositEmitted.clientAccountNumber,
            };

          const result = await controller.handleDepositReceivedEvent(
            message,
            reportOperationRepository,
            operationService,
            logger,
            ctx,
          );

          expect(result).toBeUndefined();
          expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
          expect(mockGetOperationByIdService).toHaveBeenCalledTimes(0);
          expect(mockGetCurrencyByTagService).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
