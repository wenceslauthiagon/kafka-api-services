import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  PaymentRepository,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  ReceivePixDevolutionReceivedMicroserviceController as Controller,
  OperationServiceKafka,
  BankingServiceKafka,
  PixDevolutionReceivedDatabaseRepository,
  PixDevolutionReceivedModel,
  PaymentDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import {
  PixDevolutionReceivedEventEmitterControllerInterface,
  PixDevolutionReceivedEventType,
  ReceivePixDevolutionReceivedRequest,
} from '@zro/pix-payments/interface';
import {
  PaymentFactory,
  PixDevolutionReceivedFactory,
} from '@zro/test/pix-payments/config';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';

describe('ReceivePixDevolutionReceivedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixDevolutionReceivedRepository: PixDevolutionReceivedRepository;
  let pixPaymentRepository: PaymentRepository;
  const zroBankIspb = '26264220';

  const eventEmitter: PixDevolutionReceivedEventEmitterControllerInterface =
    createMock<PixDevolutionReceivedEventEmitterControllerInterface>();
  const mockEmitPixDevolutionReceivedEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDevolutionReceivedEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockCreateOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.createOperation),
  );
  const mockAcceptOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.acceptOperation),
  );
  const mockCreateAndAcceptOperationService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.createAndAcceptOperation));
  const mockGetAccountOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getWalletAccountByAccountNumberAndCurrency),
  );

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();
  const mockGetBankingService: jest.Mock = On(bankingService).get(
    method((mock) => mock.getBankByIspb),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixDevolutionReceivedRepository =
      new PixDevolutionReceivedDatabaseRepository();
    pixPaymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleNewReceivedPixDevolutionReceivedDeadLetterEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create new received deposit successfully', async () => {
        const clientBank = new BankEntity({ ispb: zroBankIspb });
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );
        const data =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
            PixDevolutionReceivedEntity.name,
            { clientBank, payment },
          );

        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );

        const message: ReceivePixDevolutionReceivedRequest = {
          id: data.id,
          amount: data.amount,
          txId: data.txId,
          endToEndId: data.endToEndId,
          clientBankIspb: data.clientBank.ispb,
          clientBranch: data.clientBranch,
          clientAccountNumber: data.clientAccountNumber,
          clientDocument: data.clientDocument,
          clientName: data.clientName,
          clientKey: data.clientKey,
          thirdPartBankIspb: data.thirdPartBank.ispb,
          thirdPartBranch: data.thirdPartBranch,
          thirdPartAccountType: data.thirdPartAccountType,
          thirdPartAccountNumber: data.thirdPartAccountNumber,
          thirdPartDocument: data.thirdPartDocument,
          thirdPartName: data.thirdPartName,
          thirdPartKey: data.thirdPartKey,
          paymentId: data.payment.id,
          description: data.description,
        };

        mockGetAccountOperationService.mockResolvedValue(walletAccount);
        mockGetBankingService.mockResolvedValue(clientBank);

        const result = await controller.execute(
          message,
          pixDevolutionReceivedRepository,
          pixPaymentRepository,
          eventEmitter,
          operationService,
          bankingService,
          logger,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(message.id);
        expect(result.value.state).toBe(PixDevolutionReceivedState.READY);

        expect(mockGetBankingService).toHaveBeenCalledTimes(2);
        expect(mockGetAccountOperationService).toHaveBeenCalledTimes(1);
        expect(mockEmitPixDevolutionReceivedEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixDevolutionReceivedEvent.mock.calls[0][0]).toBe(
          PixDevolutionReceivedEventType.READY,
        );
        expect(mockCreateOperationService).toHaveBeenCalledTimes(0);
        expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not create if deposit already exists', async () => {
        const data =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedModel>(
            PixDevolutionReceivedModel.name,
          );

        const message: ReceivePixDevolutionReceivedRequest = {
          id: data.id,
          amount: data.amount,
          txId: data.txId,
          endToEndId: data.endToEndId,
          clientBankIspb: data.clientBankIspb,
          clientBranch: data.clientBranch,
          clientAccountNumber: data.clientAccountNumber,
          clientDocument: data.clientDocument,
          clientName: data.clientName,
          clientKey: data.clientKey,
          thirdPartBankIspb: data.thirdPartBankIspb,
          thirdPartBranch: data.thirdPartBranch,
          thirdPartAccountType: data.thirdPartAccountType,
          thirdPartAccountNumber: data.thirdPartAccountNumber,
          thirdPartDocument: data.thirdPartDocument,
          thirdPartName: data.thirdPartName,
          thirdPartKey: data.thirdPartKey,
          paymentId: data.transactionOriginalId,
          description: data.description,
        };

        const result = await controller.execute(
          message,
          pixDevolutionReceivedRepository,
          pixPaymentRepository,
          eventEmitter,
          operationService,
          bankingService,
          logger,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(data.id);
        expect(result.value.state).toBe(data.state);

        expect(mockGetBankingService).toHaveBeenCalledTimes(0);
        expect(mockGetAccountOperationService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixDevolutionReceivedEvent).toHaveBeenCalledTimes(0);
        expect(mockCreateOperationService).toHaveBeenCalledTimes(0);
        expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
