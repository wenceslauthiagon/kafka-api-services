import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  PaymentEntity,
  PaymentRepository,
  PaymentState,
  PixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import {
  HandlePendingPaymentEventUseCase as UseCase,
  PixPaymentGateway,
  PaymentEventEmitter,
  OperationService,
  BankingService,
  PaymentInvalidStateException,
  PaymentNotFoundException,
  PixDepositEventEmitter,
  BankNotFoundException,
  PixPaymentZroAccountNotExistsException,
  PaymentBetweenSameWalletException,
} from '@zro/pix-payments/application';
import { WalletAccountNotActiveException } from '@zro/operations/application';
import { PaymentFactory } from '@zro/test/pix-payments/config';
import { WalletAccountFactory } from '@zro/test/operations/config';

describe('HandlePendingPaymentEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      paymentRepository,
      depositRepository,
      mockUpdatePaymentRepository,
      mockGetPaymentByIdRepository,
      mockCreatePixDepositRepository,
    } = mockRepository();

    const {
      paymentEmitter,
      depositEmitter,
      mockWaitingPaymentEventEmitter,
      mockConfirmedPaymentEventEmitter,
      mockReceivedDepositEventEmitter,
    } = mockEmitter();

    const {
      operationService,
      mockCreateOperationService,
      mockAcceptOperationService,
      mockCreateAndAcceptOperationService,
      mockGetWalletAccountByAccountNumberAndCurrencyService,
      bankingService,
      mockGetBankingService,
    } = mockService();

    const { pspGateway, mockCreateGateway } = mockGateway();

    const pixPaymentOperationCurrencyTag = 'REAL';
    const pixPaymentOperationDescription = 'PIX_PAYMENT';
    const pixPaymentZroBankIspb = '26264220';
    const pixPaymentOperationNewPixReceivedTransactionTag = 'PIXREC';
    const pixPaymentOperationChangeTransactionTag = 'PIXCHANGE';
    const sut = new UseCase(
      logger,
      paymentRepository,
      depositRepository,
      pspGateway,
      paymentEmitter,
      operationService,
      bankingService,
      depositEmitter,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationDescription,
      pixPaymentOperationNewPixReceivedTransactionTag,
      pixPaymentZroBankIspb,
      pixPaymentOperationChangeTransactionTag,
    );
    return {
      sut,
      mockUpdatePaymentRepository,
      mockGetPaymentByIdRepository,
      mockCreatePixDepositRepository,
      mockWaitingPaymentEventEmitter,
      mockConfirmedPaymentEventEmitter,
      mockCreateOperationService,
      mockAcceptOperationService,
      mockCreateAndAcceptOperationService,
      mockGetBankingService,
      mockCreateGateway,
      mockReceivedDepositEventEmitter,
      pixPaymentZroBankIspb,
      mockGetWalletAccountByAccountNumberAndCurrencyService,
    };
  };

  const mockRepository = () => {
    const paymentRepository: PaymentRepository =
      createMock<PaymentRepository>();
    const mockUpdatePaymentRepository: jest.Mock = On(paymentRepository).get(
      method((mock) => mock.update),
    );
    const mockGetPaymentByIdRepository: jest.Mock = On(paymentRepository).get(
      method((mock) => mock.getById),
    );
    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockCreatePixDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.create),
    );

    return {
      paymentRepository,
      depositRepository,
      mockUpdatePaymentRepository,
      mockGetPaymentByIdRepository,
      mockCreatePixDepositRepository,
    };
  };

  const mockEmitter = () => {
    const paymentEmitter: PaymentEventEmitter =
      createMock<PaymentEventEmitter>();
    const mockWaitingPaymentEventEmitter: jest.Mock = On(paymentEmitter).get(
      method((mock) => mock.waitingPayment),
    );
    const mockConfirmedPaymentEventEmitter: jest.Mock = On(paymentEmitter).get(
      method((mock) => mock.confirmedPayment),
    );

    const depositEmitter: PixDepositEventEmitter =
      createMock<PixDepositEventEmitter>();
    const mockReceivedDepositEventEmitter: jest.Mock = On(depositEmitter).get(
      method((mock) => mock.receivedDeposit),
    );

    return {
      paymentEmitter,
      depositEmitter,
      mockWaitingPaymentEventEmitter,
      mockConfirmedPaymentEventEmitter,
      mockReceivedDepositEventEmitter,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockCreateOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.createOperation),
    );
    const mockAcceptOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.acceptOperation),
    );
    const mockCreateAndAcceptOperationService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.createAndAcceptOperation));
    const mockGetWalletAccountByAccountNumberAndCurrencyService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletAccountByAccountNumberAndCurrency));

    const bankingService: BankingService = createMock<BankingService>();
    const mockGetBankingService: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankByIspb),
    );

    return {
      operationService,
      mockCreateOperationService,
      mockAcceptOperationService,
      mockCreateAndAcceptOperationService,
      mockGetWalletAccountByAccountNumberAndCurrencyService,
      bankingService,
      mockGetBankingService,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockCreateGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createPayment),
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

    it('TC0002 - Should not handle pending when payment not found', async () => {
      const { sut, mockGetPaymentByIdRepository } = makeSut();

      const { id } = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.WAITING },
      );

      mockGetPaymentByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PaymentNotFoundException);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(id);
    });

    it('TC0003 - Should not handle pending when payment is already paid (indepotent) with status waiting', async () => {
      const { sut, mockGetPaymentByIdRepository } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.WAITING },
      );

      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const result = await sut.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.WAITING);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
    });

    it('TC0004 - Should not handle pending when payment is already paid (indepotent) with status confirmed', async () => {
      const { sut, mockGetPaymentByIdRepository } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.CONFIRMED },
      );

      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const result = await sut.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.CONFIRMED);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
    });

    it('TC0005 - Should not handle pending when status is not pending', async () => {
      const { sut, mockGetPaymentByIdRepository } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.CANCELED },
      );

      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const testScript = () => sut.execute(payment.id);

      await expect(testScript).rejects.toThrow(PaymentInvalidStateException);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
    });

    it('TC0006 - Should not handle pending when is P2P and account is not found', async () => {
      const {
        sut,
        pixPaymentZroBankIspb,
        mockGetPaymentByIdRepository,
        mockGetBankingService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          state: PaymentState.PENDING,
          beneficiaryBankIspb: pixPaymentZroBankIspb,
        },
      );

      mockGetPaymentByIdRepository.mockResolvedValue(payment);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        null,
      );

      const testScript = () => sut.execute(payment.id);

      await expect(testScript).rejects.toThrow(
        PixPaymentZroAccountNotExistsException,
      );
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not handle pending when is P2P and account is not active', async () => {
      const {
        sut,
        pixPaymentZroBankIspb,
        mockGetPaymentByIdRepository,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const walletAcount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.DEACTIVATE },
        );
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          state: PaymentState.PENDING,
          beneficiaryBankIspb: pixPaymentZroBankIspb,
        },
      );

      mockGetPaymentByIdRepository.mockResolvedValue(payment);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        walletAcount,
      );

      const testScript = () => sut.execute(payment.id);

      await expect(testScript).rejects.toThrow(WalletAccountNotActiveException);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should not handle pending when is P2P with same wallet and beneficiary wallet', async () => {
      const {
        sut,
        pixPaymentZroBankIspb,
        mockGetPaymentByIdRepository,
        mockGetBankingService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const walletAcount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          state: PaymentState.PENDING,
          beneficiaryBankIspb: pixPaymentZroBankIspb,
          wallet: walletAcount.wallet,
        },
      );

      mockGetPaymentByIdRepository.mockResolvedValue(payment);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        walletAcount,
      );

      const testScript = () => sut.execute(payment.id);

      await expect(testScript).rejects.toThrow(
        PaymentBetweenSameWalletException,
      );
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not handle pending when is P2P and ispb banking is not found', async () => {
      const {
        sut,
        pixPaymentZroBankIspb,
        mockGetPaymentByIdRepository,
        mockGetBankingService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const walletAcount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          state: PaymentState.PENDING,
          beneficiaryBankIspb: pixPaymentZroBankIspb,
        },
      );

      mockGetPaymentByIdRepository.mockResolvedValue(payment);
      mockGetBankingService.mockResolvedValue(undefined);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        walletAcount,
      );

      const testScript = () => sut.execute(payment.id);

      await expect(testScript).rejects.toThrow(BankNotFoundException);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0010 - Should handle pending payment and send to PSP when PIXSENDQRS operation', async () => {
      const {
        sut,
        mockGetPaymentByIdRepository,
        mockCreatePixDepositRepository,
        mockGetBankingService,
        mockCreateOperationService,
        mockCreateAndAcceptOperationService,
        mockCreateGateway,
        mockUpdatePaymentRepository,
        mockWaitingPaymentEventEmitter,
        mockReceivedDepositEventEmitter,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.PENDING, transactionTag: 'PIXSENDQRS' },
      );

      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const result = await sut.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.WAITING);
      expect(result.transactionTag).toBe('PIXSENDQRS');
      expect(mockCreatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
      expect(mockCreateOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockUpdatePaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingPaymentEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockReceivedDepositEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should handle pending payment and send to PSP when PIXWITHDRAWALQRS operation', async () => {
      const {
        sut,
        mockCreatePixDepositRepository,
        mockGetPaymentByIdRepository,
        mockGetBankingService,
        mockCreateOperationService,
        mockCreateAndAcceptOperationService,
        mockCreateGateway,
        mockUpdatePaymentRepository,
        mockWaitingPaymentEventEmitter,
        mockReceivedDepositEventEmitter,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { state: PaymentState.PENDING, transactionTag: 'PIXWITHDRAWALQRS' },
      );
      mockGetPaymentByIdRepository.mockResolvedValue(payment);

      const result = await sut.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.WAITING);
      expect(result.transactionTag).toBe('PIXWITHDRAWALQRS');
      expect(mockCreatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
      expect(mockCreateOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockUpdatePaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingPaymentEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockReceivedDepositEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should handle pending payment and send to P2P', async () => {
      const {
        sut,
        pixPaymentZroBankIspb,
        mockCreatePixDepositRepository,
        mockGetPaymentByIdRepository,
        mockGetBankingService,
        mockCreateOperationService,
        mockCreateAndAcceptOperationService,
        mockCreateGateway,
        mockUpdatePaymentRepository,
        mockWaitingPaymentEventEmitter,
        mockAcceptOperationService,
        mockConfirmedPaymentEventEmitter,
        mockReceivedDepositEventEmitter,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          state: PaymentState.PENDING,
          transactionTag: 'PIXSENDQRS',
          beneficiaryBankIspb: pixPaymentZroBankIspb,
        },
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      const banking = new BankEntity({
        ispb: pixPaymentZroBankIspb,
        name: 'bank name',
      });
      mockGetPaymentByIdRepository.mockResolvedValue(payment);
      mockGetBankingService.mockResolvedValue(banking);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        walletAccount,
      );

      const result = await sut.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.CONFIRMED);
      expect(result.transactionTag).toBe('PIXSENDQRS');
      expect(mockCreatePixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledWith(
        payment.beneficiaryBankIspb,
      );
      expect(mockCreateOperationService).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdatePaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPaymentEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockWaitingPaymentEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockReceivedDepositEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0013 - Should handle pending payment and send to P2P WITHDRAWAL', async () => {
      const {
        sut,
        pixPaymentZroBankIspb,
        mockCreatePixDepositRepository,
        mockGetPaymentByIdRepository,
        mockGetBankingService,
        mockCreateOperationService,
        mockCreateAndAcceptOperationService,
        mockCreateGateway,
        mockUpdatePaymentRepository,
        mockWaitingPaymentEventEmitter,
        mockAcceptOperationService,
        mockConfirmedPaymentEventEmitter,
        mockReceivedDepositEventEmitter,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        {
          state: PaymentState.PENDING,
          transactionTag: 'PIXWITHDRAWALQRS',
          beneficiaryBankIspb: pixPaymentZroBankIspb,
        },
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      const banking = new BankEntity({
        ispb: pixPaymentZroBankIspb,
        name: 'bank name',
      });
      mockGetPaymentByIdRepository.mockResolvedValue(payment);
      mockGetBankingService.mockResolvedValue(banking);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        walletAccount,
      );

      const result = await sut.execute(payment.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.CONFIRMED);
      expect(result.transactionTag).toBe('PIXWITHDRAWALQRS');
      expect(mockCreatePixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByIdRepository).toHaveBeenCalledWith(payment.id);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledWith(
        payment.beneficiaryBankIspb,
      );
      expect(mockCreateOperationService).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdatePaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPaymentEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockWaitingPaymentEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockReceivedDepositEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
