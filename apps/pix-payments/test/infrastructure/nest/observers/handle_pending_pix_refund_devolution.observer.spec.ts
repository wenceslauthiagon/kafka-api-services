import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  OperationServiceKafka,
  PendingPixRefundDevolutionNestObserver as Controller,
} from '@zro/pix-payments/infrastructure';
import {
  PixDepositEntity,
  PixDepositRepository,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedRepository,
  PixRefundDevolutionEntity,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
} from '@zro/pix-payments/domain';
import {
  HandlePendingPixRefundDevolutionEventRequest,
  PixRefundDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  PixDevolutionReceivedFactory,
  PixRefundDevolutionFactory,
} from '@zro/test/pix-payments/config';
import { UserEntity } from '@zro/users/domain';
import { BankEntity } from '@zro/banking/domain';
import {
  OperationEntity,
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CompletePixRefundDevolutionController', () => {
  let module: TestingModule;
  let controller: Controller;

  const pixRefundDevolutionRepository: PixRefundDevolutionRepository =
    createMock<PixRefundDevolutionRepository>();
  const mockGetByIdRefundDevolutionRepository: jest.Mock = On(
    pixRefundDevolutionRepository,
  ).get(method((mock) => mock.getById));
  const mockUpdateRefundDevolutionRepository: jest.Mock = On(
    pixRefundDevolutionRepository,
  ).get(method((mock) => mock.update));

  const depositRepository: PixDepositRepository =
    createMock<PixDepositRepository>();
  const mockGetByIdDepositRepository: jest.Mock = On(depositRepository).get(
    method((mock) => mock.getById),
  );

  const serviceEventEmitter: PixRefundDevolutionEventEmitterControllerInterface =
    createMock<PixRefundDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(serviceEventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
  const mockCreatePixDevolutionRefundPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createPixDevolutionRefund),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetWalletAccountByAccountNumberAndCurrencyService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.getWalletAccountByAccountNumberAndCurrency));
  const mockCreateAndAcceptOperationService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.createAndAcceptOperation));

  const devolutionReceivedRepository: PixDevolutionReceivedRepository =
    createMock<PixDevolutionReceivedRepository>();
  const mockGetByIdDevolutionReceivedRepository: jest.Mock = On(
    devolutionReceivedRepository,
  ).get(method((mock) => mock.getById));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('PendingRefund', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not update with invalid id', async () => {
        const refundDevolution =
          await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
            PixRefundDevolutionEntity.name,
          );
        mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);

        const { state } = refundDevolution;

        const message: HandlePendingPixRefundDevolutionEventRequest = {
          id: null,
          state,
          userId: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.handlePendingPixRefundDevolutionEventViaTopazio(
            message,
            pixRefundDevolutionRepository,
            depositRepository,
            serviceEventEmitter,
            pspGateway,
            operationService,
            devolutionReceivedRepository,
            logger,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
        expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(
          0,
        );
        expect(
          mockGetWalletAccountByAccountNumberAndCurrencyService,
        ).toHaveBeenCalledTimes(0);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
        expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(
          0,
        );
      });
      it('TC0002 - Should not update with invalid userId', async () => {
        const refundDevolution =
          await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
            PixRefundDevolutionEntity.name,
          );

        const { id, state } = refundDevolution;

        mockGetByIdRefundDevolutionRepository.mockResolvedValue(
          refundDevolution,
        );

        const message: HandlePendingPixRefundDevolutionEventRequest = {
          id,
          state,
          userId: null,
        };

        const testScript = () =>
          controller.handlePendingPixRefundDevolutionEventViaTopazio(
            message,
            pixRefundDevolutionRepository,
            depositRepository,
            serviceEventEmitter,
            pspGateway,
            operationService,
            devolutionReceivedRepository,
            logger,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
        expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(
          0,
        );
        expect(
          mockGetWalletAccountByAccountNumberAndCurrencyService,
        ).toHaveBeenCalledTimes(0);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
        expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(
          0,
        );
      });
    });
  });
  describe('With valid parameters', () => {
    it('TC0003 - Should create refund devolution successfully with PixDevolution - Beneficiary Zro', async () => {
      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          {
            thirdPartBank: new BankEntity({
              ispb: '26264220',
              name: 'test',
            }),
          },
        );

      const operation = new OperationEntity({ id: faker.datatype.uuid() });
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 9999 }),
        uuid: faker.datatype.uuid(),
      });
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            state: PixRefundDevolutionState.PENDING,
            user,
            transaction,
            operation,
          },
        );
      const { id, state } = refundDevolution;

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(transaction);
      mockGetByIdDepositRepository.mockResolvedValue(null);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        walletAccount,
      );

      const message: HandlePendingPixRefundDevolutionEventRequest = {
        id,
        state,
        userId: refundDevolution.user.uuid,
      };

      await controller.handlePendingPixRefundDevolutionEventViaTopazio(
        message,
        pixRefundDevolutionRepository,
        depositRepository,
        serviceEventEmitter,
        pspGateway,
        operationService,
        devolutionReceivedRepository,
        logger,
        ctx,
      );

      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should create refund devolution successfully with PixDevolution - Beneficiary Not Zro', async () => {
      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          {
            thirdPartBank: new BankEntity({
              ispb: 'test',
              name: 'test',
            }),
          },
        );

      const operation = new OperationEntity({ id: faker.datatype.uuid() });
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 9999 }),
        uuid: faker.datatype.uuid(),
      });
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            state: PixRefundDevolutionState.PENDING,
            user,
            transaction,
            operation,
          },
        );
      const { id, state } = refundDevolution;

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(transaction);
      mockGetByIdDepositRepository.mockResolvedValue(null);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        walletAccount,
      );
      mockCreatePixDevolutionRefundPspGateway.mockResolvedValue({
        endToEndId: transaction.endToEndId,
      });

      const message: HandlePendingPixRefundDevolutionEventRequest = {
        id,
        state,
        userId: refundDevolution.user.uuid,
      };

      await controller.handlePendingPixRefundDevolutionEventViaTopazio(
        message,
        pixRefundDevolutionRepository,
        depositRepository,
        serviceEventEmitter,
        pspGateway,
        operationService,
        devolutionReceivedRepository,
        logger,
        ctx,
      );

      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(1);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should create refund devolution successfully with Deposit - Beneficiary Zro', async () => {
      const transaction = await PixDepositFactory.create<PixDepositEntity>(
        PixDevolutionReceivedEntity.name,
        {
          thirdPartBank: new BankEntity({
            ispb: '26264220',
            name: 'test',
          }),
        },
      );

      const operation = new OperationEntity({ id: faker.datatype.uuid() });
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 9999 }),
        uuid: faker.datatype.uuid(),
      });
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            state: PixRefundDevolutionState.PENDING,
            user,
            transaction,
            operation,
          },
        );
      const { id, state } = refundDevolution;

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(null);
      mockGetByIdDepositRepository.mockResolvedValue(transaction);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        walletAccount,
      );

      const message: HandlePendingPixRefundDevolutionEventRequest = {
        id,
        state,
        userId: refundDevolution.user.uuid,
      };

      await controller.handlePendingPixRefundDevolutionEventViaTopazio(
        message,
        pixRefundDevolutionRepository,
        depositRepository,
        serviceEventEmitter,
        pspGateway,
        operationService,
        devolutionReceivedRepository,
        logger,
        ctx,
      );

      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should create refund devolution successfully with Deposit - Beneficiary Not Zro', async () => {
      const transaction = await PixDepositFactory.create<PixDepositEntity>(
        PixDevolutionReceivedEntity.name,
        {
          thirdPartBank: new BankEntity({
            ispb: 'test',
            name: 'test',
          }),
        },
      );

      const operation = new OperationEntity({ id: faker.datatype.uuid() });
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 9999 }),
        uuid: faker.datatype.uuid(),
      });
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            state: PixRefundDevolutionState.PENDING,
            user,
            transaction,
            operation,
          },
        );
      const { id, state } = refundDevolution;

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(null);
      mockGetByIdDepositRepository.mockResolvedValue(transaction);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        walletAccount,
      );
      mockCreatePixDevolutionRefundPspGateway.mockResolvedValue({
        endToEndId: transaction.endToEndId,
      });

      const message: HandlePendingPixRefundDevolutionEventRequest = {
        id,
        state,
        userId: refundDevolution.user.uuid,
      };

      await controller.handlePendingPixRefundDevolutionEventViaTopazio(
        message,
        pixRefundDevolutionRepository,
        depositRepository,
        serviceEventEmitter,
        pspGateway,
        operationService,
        devolutionReceivedRepository,
        logger,
        ctx,
      );

      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(1);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
    });
  });
});
