import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PaymentEntity,
  PaymentRepository,
  PixDepositEntity,
  PixDepositRepository,
  PixDevolutionEntity,
  PixDevolutionReceivedRepository,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import {
  HandlePendingPixDevolutionEventUseCase as UseCase,
  PixPaymentGateway,
  PixDevolutionEventEmitter,
  OperationService,
  PixDevolutionInvalidStateException,
  PixDevolutionNotFoundException,
  PixDepositNotFoundException,
  PixDevolutionReceivedEventEmitter,
  PaymentNotFoundException,
} from '@zro/pix-payments/application';
import {
  PaymentFactory,
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';
import { WalletAccountFactory } from '@zro/test/operations/config';

describe('HandlePendingPixDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      devolutionRepository,
      depositRepository,
      paymentRepository,
      devolutionReceivedRepository,
      mockUpdateDevolutionRepository,
      mockGetByIdDevolutionRepository,
      mockGetByIdDepositRepository,
      mockGetByOperationPaymentRepository,
      mockCreateDevolutionReceivedRepository,
    } = mockRepository();

    const {
      eventEmitter,
      eventDevolutionReceivedEmitter,
      mockWaitingEventEmitter,
      mockConfirmedEventEmitter,
      mockReceiveEventEmitter,
    } = mockEmitter();

    const {
      operationService,
      mockGetOperationService,
      mockCreateOperationService,
      mockAcceptOperationService,
      mockCreateAndAcceptOperationService,
      mockGetWalletAccountService,
    } = mockService();

    const { pspGateway, mockCreateGateway } = mockGateway();

    const pixDevolutionOperationCurrencyTag = 'REAL';
    const pixDevolutionOperationTransactionTag = 'PIXDEVSEND';
    const pixPaymentZroBankIspb = '26264220';
    const pixDevolutionReceivedOperationTransactionTag = 'PIXDEVREC';

    const sut = new UseCase(
      logger,
      devolutionRepository,
      depositRepository,
      pspGateway,
      eventEmitter,
      operationService,
      paymentRepository,
      devolutionReceivedRepository,
      eventDevolutionReceivedEmitter,
      pixDevolutionOperationCurrencyTag,
      pixDevolutionOperationTransactionTag,
      pixPaymentZroBankIspb,
      pixDevolutionReceivedOperationTransactionTag,
    );
    return {
      sut,
      mockUpdateDevolutionRepository,
      mockGetByIdDevolutionRepository,
      mockGetByIdDepositRepository,
      mockWaitingEventEmitter,
      mockConfirmedEventEmitter,
      mockGetOperationService,
      mockCreateOperationService,
      mockAcceptOperationService,
      mockCreateAndAcceptOperationService,
      mockGetWalletAccountService,
      mockCreateGateway,
      pixPaymentZroBankIspb,
      mockGetByOperationPaymentRepository,
      mockCreateDevolutionReceivedRepository,
      mockReceiveEventEmitter,
    };
  };

  const mockRepository = () => {
    const devolutionRepository: PixDevolutionRepository =
      createMock<PixDevolutionRepository>();
    const mockUpdateDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.update));
    const mockGetByIdDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.getById));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetByIdDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.getById),
    );

    const paymentRepository: PaymentRepository =
      createMock<PaymentRepository>();
    const mockGetByOperationPaymentRepository: jest.Mock = On(
      paymentRepository,
    ).get(method((mock) => mock.getByOperation));

    const devolutionReceivedRepository: PixDevolutionReceivedRepository =
      createMock<PixDevolutionReceivedRepository>();
    const mockCreateDevolutionReceivedRepository: jest.Mock = On(
      devolutionReceivedRepository,
    ).get(method((mock) => mock.create));

    return {
      devolutionRepository,
      depositRepository,
      paymentRepository,
      devolutionReceivedRepository,
      mockUpdateDevolutionRepository,
      mockGetByIdDevolutionRepository,
      mockGetByIdDepositRepository,
      mockGetByOperationPaymentRepository,
      mockCreateDevolutionReceivedRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixDevolutionEventEmitter =
      createMock<PixDevolutionEventEmitter>();
    const mockWaitingEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.waitingDevolution),
    );
    const mockConfirmedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.confirmedDevolution),
    );

    const eventDevolutionReceivedEmitter: PixDevolutionReceivedEventEmitter =
      createMock<PixDevolutionReceivedEventEmitter>();
    const mockReceiveEventEmitter: jest.Mock = On(
      eventDevolutionReceivedEmitter,
    ).get(method((mock) => mock.readyDevolutionReceived));

    return {
      eventEmitter,
      eventDevolutionReceivedEmitter,
      mockWaitingEventEmitter,
      mockConfirmedEventEmitter,
      mockReceiveEventEmitter,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.getWalletAccountByAccountNumberAndCurrency),
    );
    const mockCreateOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.createOperation),
    );
    const mockAcceptOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.acceptOperation),
    );
    const mockCreateAndAcceptOperationService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.createAndAcceptOperation));
    const mockGetWalletAccountService: jest.Mock = On(operationService).get(
      method((mock) => mock.getWalletAccountByAccountNumberAndCurrency),
    );

    return {
      operationService,
      mockGetOperationService,
      mockCreateOperationService,
      mockAcceptOperationService,
      mockCreateAndAcceptOperationService,
      mockGetWalletAccountService,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockCreateGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createPixDevolution),
    );

    return {
      pspGateway,
      mockCreateGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle pending when id is null', async () => {
      const { sut } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should not handle pending when devolution not found', async () => {
      const { sut, mockGetByIdDevolutionRepository } = makeSut();

      const { id } = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );

      mockGetByIdDevolutionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PixDevolutionNotFoundException);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledWith(id);
    });

    it('TC0003 - Should not handle pending when devolution state is waiting', async () => {
      const { sut, mockGetByIdDevolutionRepository } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.WAITING },
      );

      mockGetByIdDevolutionRepository.mockResolvedValue(devolution);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixDevolutionState.WAITING);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
    });

    it('TC0004 - Should not handle pending when devolution state is confirmed', async () => {
      const { sut, mockGetByIdDevolutionRepository } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.CONFIRMED },
      );

      mockGetByIdDevolutionRepository.mockResolvedValue(devolution);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixDevolutionState.CONFIRMED);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
    });

    it('TC0005 - Should not handle pending when state is not pending', async () => {
      const { sut, mockGetByIdDevolutionRepository } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.CANCELED },
      );

      mockGetByIdDevolutionRepository.mockResolvedValue(devolution);

      const testScript = () => sut.execute(devolution.id);

      expect(testScript).rejects.toThrow(PixDevolutionInvalidStateException);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
    });

    it('TC0006 - Should not handle pending when devolution deposit is not found', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.PENDING },
      );

      mockGetByIdDevolutionRepository.mockResolvedValue(devolution);
      mockGetByIdDepositRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(devolution.id);

      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledWith(
        devolution.deposit.id,
      );
    });

    it('TC0007 - Should not handle pending when P2P and payment for deposit is not found', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByOperationPaymentRepository,
        mockCreateDevolutionReceivedRepository,
        mockGetWalletAccountService,
        mockReceiveEventEmitter,
        pixPaymentZroBankIspb,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.PENDING },
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );
      deposit.clientBank.ispb = pixPaymentZroBankIspb;
      deposit.thirdPartBank.ispb = pixPaymentZroBankIspb;
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(devolution);
      mockGetByIdDepositRepository.mockResolvedValue(deposit);
      mockGetWalletAccountService.mockResolvedValue(walletAccount);
      mockGetByOperationPaymentRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(devolution.id);

      await expect(testScript).rejects.toThrow(PaymentNotFoundException);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledWith(
        devolution.deposit.id,
      );
      expect(mockGetByOperationPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockReceiveEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0008 - Should handle pending devolution and send to PSP', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
        mockCreateOperationService,
        mockCreateAndAcceptOperationService,
        mockAcceptOperationService,
        mockGetWalletAccountService,
        mockCreateGateway,
        mockUpdateDevolutionRepository,
        mockConfirmedEventEmitter,
        mockWaitingEventEmitter,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.PENDING },
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );
      deposit.clientBank.ispb = null;
      deposit.thirdPartBank.ispb = null;

      mockGetByIdDevolutionRepository.mockResolvedValue(devolution);
      mockGetByIdDepositRepository.mockResolvedValue(deposit);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixDevolutionState.WAITING);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledWith(
        devolution.deposit.id,
      );
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(0);
      expect(mockCreateOperationService).toHaveBeenCalledTimes(1);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should handle pending devolution and send to P2P', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockGetByIdDepositRepository,
        mockCreateOperationService,
        mockCreateAndAcceptOperationService,
        mockCreateGateway,
        mockUpdateDevolutionRepository,
        mockWaitingEventEmitter,
        mockAcceptOperationService,
        mockGetWalletAccountService,
        mockConfirmedEventEmitter,
        pixPaymentZroBankIspb,
        mockGetByOperationPaymentRepository,
        mockCreateDevolutionReceivedRepository,
        mockReceiveEventEmitter,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );
      deposit.clientBank.ispb = pixPaymentZroBankIspb;
      deposit.thirdPartBank.ispb = pixPaymentZroBankIspb;
      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.PENDING, deposit },
      );
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
      );
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(devolution);
      mockGetByIdDepositRepository.mockResolvedValue(deposit);
      mockGetByOperationPaymentRepository.mockResolvedValue(payment);
      mockGetWalletAccountService.mockResolvedValue(walletAccount);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixDevolutionState.CONFIRMED);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledWith(
        devolution.deposit.id,
      );
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(1);
      expect(mockCreateOperationService).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockWaitingEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCreateDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockReceiveEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
