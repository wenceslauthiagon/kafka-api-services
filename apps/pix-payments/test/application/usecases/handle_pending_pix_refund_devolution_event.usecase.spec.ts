import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixRefundDevolutionEntity,
  PixDevolutionReceivedEntity,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixDepositEntity,
} from '@zro/pix-payments/domain';
import { BankEntity } from '@zro/banking/domain';
import {
  OperationEntity,
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  HandlePendingPixRefundDevolutionEventUseCase as UseCase,
  PixRefundDevolutionNotFoundException,
  PixRefundDevolutionInvalidStateException,
  OperationService,
  PixRefundDevolutionEventEmitter,
  PixPaymentGateway,
  PixTransactionNotFoundException,
  PixRefundTransactionZroAccountNotExistsException,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  PixDevolutionReceivedFactory,
  PixRefundDevolutionFactory,
} from '@zro/test/pix-payments/config';
import { WalletAccountFactory } from '@zro/test/operations/config';

describe('HandlePendingPixRefundDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixRefundDevolutionEventEmitter =
      createMock<PixRefundDevolutionEventEmitter>();

    const mockWaitingRefundDevolution: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.waitingRefundDevolution),
    );

    const mockConfirmedRefundDevolution: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.confirmedRefundDevolution),
    );

    return {
      eventEmitter,
      mockWaitingRefundDevolution,
      mockConfirmedRefundDevolution,
    };
  };

  const mockRepository = () => {
    const refundDevolutionRepository: PixRefundDevolutionRepository =
      createMock<PixRefundDevolutionRepository>();
    const mockUpdateRefundDevolutionRepository: jest.Mock = On(
      refundDevolutionRepository,
    ).get(method((mock) => mock.update));
    const mockGetByIdRefundDevolutionRepository: jest.Mock = On(
      refundDevolutionRepository,
    ).get(method((mock) => mock.getById));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetByIdDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.getById),
    );

    const devolutionReceivedRepository: PixDevolutionReceivedRepository =
      createMock<PixDevolutionReceivedRepository>();
    const mockGetByIdDevolutionReceivedRepository: jest.Mock = On(
      devolutionReceivedRepository,
    ).get(method((mock) => mock.getById));

    return {
      refundDevolutionRepository,
      mockUpdateRefundDevolutionRepository,
      mockGetByIdRefundDevolutionRepository,
      depositRepository,
      mockGetByIdDepositRepository,
      devolutionReceivedRepository,
      mockGetByIdDevolutionReceivedRepository,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockCreatePixDevolutionRefundPspGateway: jest.Mock = On(
      pspGateway,
    ).get(method((mock) => mock.createPixDevolutionRefund));

    return {
      pspGateway,
      mockCreatePixDevolutionRefundPspGateway,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();

    const mockCreateAcceptOperationService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.createAndAcceptOperation));

    const mockGetWalletAccountByAccountNumberAndCurrencyService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletAccountByAccountNumberAndCurrency));

    return {
      operationService,
      mockCreateAcceptOperationService,
      mockGetWalletAccountByAccountNumberAndCurrencyService,
    };
  };

  const makeSut = () => {
    const pixSendRefundDevolutionOperationCurrencyTag = 'test';
    const pixSendRefundDevolutionOperationTransactionTag = 'test';
    const pixDevolutionZroBankIspb = 'test';
    const {
      refundDevolutionRepository,
      mockUpdateRefundDevolutionRepository,
      mockGetByIdRefundDevolutionRepository,
      depositRepository,
      mockGetByIdDepositRepository,
      devolutionReceivedRepository,
      mockGetByIdDevolutionReceivedRepository,
    } = mockRepository();

    const { pspGateway, mockCreatePixDevolutionRefundPspGateway } =
      mockGateway();

    const {
      eventEmitter,
      mockWaitingRefundDevolution,
      mockConfirmedRefundDevolution,
    } = mockEmitter();

    const {
      operationService,
      mockCreateAcceptOperationService,
      mockGetWalletAccountByAccountNumberAndCurrencyService,
    } = mockService();

    const sut = new UseCase(
      logger,
      refundDevolutionRepository,
      depositRepository,
      pspGateway,
      eventEmitter,
      operationService,
      devolutionReceivedRepository,
      pixSendRefundDevolutionOperationCurrencyTag,
      pixSendRefundDevolutionOperationTransactionTag,
      pixDevolutionZroBankIspb,
    );

    return {
      sut,
      mockUpdateRefundDevolutionRepository,
      mockGetByIdRefundDevolutionRepository,
      mockGetByIdDepositRepository,
      mockGetByIdDevolutionReceivedRepository,
      mockWaitingRefundDevolution,
      mockConfirmedRefundDevolution,
      mockCreatePixDevolutionRefundPspGateway,
      mockCreateAcceptOperationService,
      mockGetWalletAccountByAccountNumberAndCurrencyService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockUpdateRefundDevolutionRepository,
        mockGetByIdRefundDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockWaitingRefundDevolution,
        mockConfirmedRefundDevolution,
        mockCreatePixDevolutionRefundPspGateway,
        mockCreateAcceptOperationService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if PixRefund not exists', async () => {
      const {
        sut,
        mockUpdateRefundDevolutionRepository,
        mockGetByIdRefundDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockWaitingRefundDevolution,
        mockConfirmedRefundDevolution,
        mockCreatePixDevolutionRefundPspGateway,
        mockCreateAcceptOperationService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const { id } =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          { state: PixRefundDevolutionState.PENDING },
        );
      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(
        PixRefundDevolutionNotFoundException,
      );
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if state is invalid', async () => {
      const {
        sut,
        mockUpdateRefundDevolutionRepository,
        mockGetByIdRefundDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockWaitingRefundDevolution,
        mockConfirmedRefundDevolution,
        mockCreatePixDevolutionRefundPspGateway,
        mockCreateAcceptOperationService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          { state: PixRefundDevolutionState.ERROR },
        );
      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);

      const testScript = () => sut.execute(refundDevolution.id);

      await expect(testScript).rejects.toThrow(
        PixRefundDevolutionInvalidStateException,
      );
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
      expect(mockWaitingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not update if transaction not exists', async () => {
      const {
        sut,
        mockUpdateRefundDevolutionRepository,
        mockGetByIdRefundDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockWaitingRefundDevolution,
        mockConfirmedRefundDevolution,
        mockCreatePixDevolutionRefundPspGateway,
        mockCreateAcceptOperationService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          { state: PixRefundDevolutionState.PENDING, transaction },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(null);
      mockGetByIdDepositRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(refundDevolution.id);

      await expect(testScript).rejects.toThrow(PixTransactionNotFoundException);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not update if account not exists', async () => {
      const {
        sut,
        mockUpdateRefundDevolutionRepository,
        mockGetByIdRefundDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockWaitingRefundDevolution,
        mockConfirmedRefundDevolution,
        mockCreatePixDevolutionRefundPspGateway,
        mockCreateAcceptOperationService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          {
            thirdPartBank: new BankEntity({ ispb: 'test', name: 'test' }),
          },
        );
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          { state: PixRefundDevolutionState.PENDING, transaction },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(transaction);
      mockGetByIdDepositRepository.mockResolvedValue(null);
      mockGetWalletAccountByAccountNumberAndCurrencyService.mockResolvedValue(
        null,
      );

      const testScript = () => sut.execute(refundDevolution.id);

      await expect(testScript).rejects.toThrow(
        PixRefundTransactionZroAccountNotExistsException,
      );
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create refund devolution successfully with PixDevolution- Beneficiary Zro', async () => {
      const {
        sut,
        mockUpdateRefundDevolutionRepository,
        mockGetByIdRefundDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockWaitingRefundDevolution,
        mockConfirmedRefundDevolution,
        mockCreatePixDevolutionRefundPspGateway,
        mockCreateAcceptOperationService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          { thirdPartBank: new BankEntity({ ispb: 'test', name: 'test' }) },
        );
      const operation = new OperationEntity({ id: uuidV4() });
      const user = new UserEntity({ uuid: uuidV4() });
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            state: PixRefundDevolutionState.PENDING,
            transaction,
            operation,
            user,
          },
        );

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

      const result = await sut.execute(refundDevolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixRefundDevolutionState.CONFIRMED);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(1);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should create refund devolution successfully with PixDevolution - Beneficiary Not Zro', async () => {
      const {
        sut,
        mockUpdateRefundDevolutionRepository,
        mockGetByIdRefundDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockWaitingRefundDevolution,
        mockConfirmedRefundDevolution,
        mockCreatePixDevolutionRefundPspGateway,
        mockCreateAcceptOperationService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const transaction =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          { thirdPartBank: new BankEntity({ ispb: 'notzro', name: 'test' }) },
        );
      const operation = new OperationEntity({ id: uuidV4() });
      const user = new UserEntity({ uuid: uuidV4() });
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            state: PixRefundDevolutionState.PENDING,
            transaction,
            operation,
            user,
          },
        );
      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);
      mockGetByIdDevolutionReceivedRepository.mockResolvedValue(transaction);
      mockGetByIdDepositRepository.mockResolvedValue(null);

      const result = await sut.execute(refundDevolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixRefundDevolutionState.WAITING);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingRefundDevolution).toHaveBeenCalledTimes(1);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should create refund devolution successfully with deposit - Beneficiary Zro', async () => {
      const {
        sut,
        mockUpdateRefundDevolutionRepository,
        mockGetByIdRefundDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockWaitingRefundDevolution,
        mockConfirmedRefundDevolution,
        mockCreatePixDevolutionRefundPspGateway,
        mockCreateAcceptOperationService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const transaction = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { thirdPartBank: new BankEntity({ ispb: 'test', name: 'test' }) },
      );
      const operation = new OperationEntity({ id: uuidV4() });
      const user = new UserEntity({ uuid: uuidV4() });
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            state: PixRefundDevolutionState.PENDING,
            transaction,
            operation,
            user,
          },
        );
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

      const result = await sut.execute(refundDevolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixRefundDevolutionState.CONFIRMED);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(1);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should create refund devolution successfully with deposit - Beneficiary Not Zro', async () => {
      const {
        sut,
        mockUpdateRefundDevolutionRepository,
        mockGetByIdRefundDevolutionRepository,
        mockGetByIdDepositRepository,
        mockGetByIdDevolutionReceivedRepository,
        mockWaitingRefundDevolution,
        mockConfirmedRefundDevolution,
        mockCreatePixDevolutionRefundPspGateway,
        mockCreateAcceptOperationService,
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      } = makeSut();

      const transaction = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { thirdPartBank: new BankEntity({ ispb: 'notzro', name: 'test' }) },
      );
      const operation = new OperationEntity({ id: uuidV4() });
      const user = new UserEntity({ uuid: uuidV4() });
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            state: PixRefundDevolutionState.PENDING,
            transaction,
            operation,
            user,
          },
        );
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

      const result = await sut.execute(refundDevolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixRefundDevolutionState.WAITING);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingRefundDevolution).toHaveBeenCalledTimes(1);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCreatePixDevolutionRefundPspGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrencyService,
      ).toHaveBeenCalledTimes(0);
    });
  });
});
