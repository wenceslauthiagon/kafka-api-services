import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import {
  ReportPixDevolutionReceivedNestObserver as Observer,
  OperationServiceKafka,
  ReportOperationDatabaseRepository,
} from '@zro/reports/infrastructure';
import { PixDevolutionReceivedEntity } from '@zro/pix-payments/domain';
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
import { PixDevolutionReceivedFactory } from '@zro/test/pix-payments/config';
import { HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest } from '@zro/reports/interface';

describe('ReportPixDevolutionReceivedNestObserver', () => {
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

  describe('handleDevolutionReceivedEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create report successfully', async () => {
        const devolutionReceivedEmitted =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
            PixDevolutionReceivedEntity.name,
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

        const message: HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest =
          {
            id: devolutionReceivedEmitted.id,
            userId: devolutionReceivedEmitted.user.uuid,
            operationId: devolutionReceivedEmitted.operation.id,
            transactionTag: devolutionReceivedEmitted.transactionTag,
            thirdPartName: devolutionReceivedEmitted.thirdPartName,
            thirdPartDocument: devolutionReceivedEmitted.thirdPartDocument,
            thirdPartBankIspb: devolutionReceivedEmitted.thirdPartBank.ispb,
            thirdPartBranch: devolutionReceivedEmitted.thirdPartBranch,
            thirdPartAccountNumber:
              devolutionReceivedEmitted.thirdPartAccountNumber,
            clientName: devolutionReceivedEmitted.clientName,
            clientDocument: devolutionReceivedEmitted.clientDocument,
            clientBranch: devolutionReceivedEmitted.clientBranch,
            clientAccountNumber: devolutionReceivedEmitted.clientAccountNumber,
          };

        const result = await controller.handleDevolutionReceivedEvent(
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
          const devolutionReceivedEmitted =
            await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
              PixDevolutionReceivedEntity.name,
            );

          mockGetTransactionTypeByTagService.mockResolvedValue(undefined);

          const message: HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest =
            {
              id: devolutionReceivedEmitted.id,
              userId: devolutionReceivedEmitted.user.uuid,
              operationId: devolutionReceivedEmitted.operation.id,
              transactionTag: devolutionReceivedEmitted.transactionTag,
              thirdPartName: devolutionReceivedEmitted.thirdPartName,
              thirdPartDocument: devolutionReceivedEmitted.thirdPartDocument,
              thirdPartBankIspb: devolutionReceivedEmitted.thirdPartBank.ispb,
              thirdPartBranch: devolutionReceivedEmitted.thirdPartBranch,
              thirdPartAccountNumber:
                devolutionReceivedEmitted.thirdPartAccountNumber,
              clientName: devolutionReceivedEmitted.clientName,
              clientDocument: devolutionReceivedEmitted.clientDocument,
              clientBranch: devolutionReceivedEmitted.clientBranch,
              clientAccountNumber:
                devolutionReceivedEmitted.clientAccountNumber,
            };

          const result = await controller.handleDevolutionReceivedEvent(
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
