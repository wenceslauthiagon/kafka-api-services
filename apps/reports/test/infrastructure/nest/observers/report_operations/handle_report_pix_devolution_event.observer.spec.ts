import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import {
  ReportPixDevolutionNestObserver as Observer,
  OperationServiceKafka,
  ReportOperationDatabaseRepository,
} from '@zro/reports/infrastructure';
import {
  PixDepositEntity,
  PixDevolutionEntity,
} from '@zro/pix-payments/domain';
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
import {
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';
import { HandleCreateReportOperationByPixDevolutionConfirmedEventRequest } from '@zro/reports/interface';

describe('ReportPixDevolutionNestObserver', () => {
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

  describe('handleConfirmedDevolutionEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create report successfully', async () => {
        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
        );

        const devolutionEmitted =
          await PixDevolutionFactory.create<PixDevolutionEntity>(
            PixDevolutionEntity.name,
            { deposit },
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

        const message: HandleCreateReportOperationByPixDevolutionConfirmedEventRequest =
          {
            id: devolutionEmitted.id,
            userId: devolutionEmitted.user.uuid,
            operationId: devolutionEmitted.operation.id,
            transactionTag: devolutionEmitted.deposit.transactionTag,
            thirdPartName: devolutionEmitted.deposit.thirdPartName,
            thirdPartDocument: devolutionEmitted.deposit.thirdPartDocument,
            thirdPartBankIspb: devolutionEmitted.deposit.thirdPartBank.ispb,
            thirdPartBranch: devolutionEmitted.deposit.thirdPartBranch,
            thirdPartAccountNumber:
              devolutionEmitted.deposit.thirdPartAccountNumber,
            clientName: devolutionEmitted.deposit.clientName,
            clientDocument: devolutionEmitted.deposit.clientDocument,
            clientBranch: devolutionEmitted.deposit.clientBranch,
            clientAccountNumber: devolutionEmitted.deposit.clientAccountNumber,
          };

        const result = await controller.handleConfirmedDevolutionEvent(
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
          const deposit = await PixDepositFactory.create<PixDepositEntity>(
            PixDepositEntity.name,
          );

          const devolutionEmitted =
            await PixDevolutionFactory.create<PixDevolutionEntity>(
              PixDevolutionEntity.name,
              { deposit },
            );

          mockGetTransactionTypeByTagService.mockResolvedValue(undefined);

          const message: HandleCreateReportOperationByPixDevolutionConfirmedEventRequest =
            {
              id: devolutionEmitted.id,
              userId: devolutionEmitted.user.uuid,
              operationId: devolutionEmitted.operation.id,
              transactionTag: devolutionEmitted.deposit.transactionTag,
              thirdPartName: devolutionEmitted.deposit.thirdPartName,
              thirdPartDocument: devolutionEmitted.deposit.thirdPartDocument,
              thirdPartBankIspb: devolutionEmitted.deposit.thirdPartBank.ispb,
              thirdPartBranch: devolutionEmitted.deposit.thirdPartBranch,
              thirdPartAccountNumber:
                devolutionEmitted.deposit.thirdPartAccountNumber,
              clientName: devolutionEmitted.deposit.clientName,
              clientDocument: devolutionEmitted.deposit.clientDocument,
              clientBranch: devolutionEmitted.deposit.clientBranch,
              clientAccountNumber:
                devolutionEmitted.deposit.clientAccountNumber,
            };

          const result = await controller.handleConfirmedDevolutionEvent(
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
