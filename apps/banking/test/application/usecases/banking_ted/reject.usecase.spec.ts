import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  BankingTedEntity,
  BankingTedFailureRepository,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import { WalletEntity, WalletState } from '@zro/operations/domain';
import {
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';
import {
  RejectBankingTedUseCase as UseCase,
  BankingTedEventEmitter,
  OperationService,
  BankingTedInvalidStateException,
  BankingTedNotFoundException,
} from '@zro/banking/application';
import { BankingTedFactory } from '@zro/test/banking/config';
import { WalletFactory } from '@zro/test/operations/config';

describe('RejectBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      bankingTedRepository,
      bankingTedFailureRepository,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
      mockCreateBankingTedFailureRepository,
    } = mockRepository();

    const { eventEmitter, mockFailedEventEmitter } = mockEmitter();

    const {
      operationService,
      mockCreateAndAcceptOperationService,
      mockGetWalletByUserAndDefaultIsTrueService,
    } = mockService();

    const bankingTedOperationCurrencyTag = 'REAL';
    const bankingTedFailureOperationTransactionTag = 'TEDFAILURE';
    const bankingTedFailureOperationDescription = 'TED Failure Description';

    const sut = new UseCase(
      logger,
      bankingTedRepository,
      bankingTedFailureRepository,
      eventEmitter,
      operationService,
      bankingTedOperationCurrencyTag,
      bankingTedFailureOperationTransactionTag,
      bankingTedFailureOperationDescription,
    );
    return {
      sut,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
      mockCreateBankingTedFailureRepository,
      mockCreateAndAcceptOperationService,
      mockGetWalletByUserAndDefaultIsTrueService,
      mockFailedEventEmitter,
      bankingTedFailureOperationTransactionTag,
      bankingTedFailureOperationDescription,
    };
  };

  const mockRepository = () => {
    const bankingTedRepository: BankingTedRepository =
      createMock<BankingTedRepository>();
    const mockUpdateBankingTedRepository: jest.Mock = On(
      bankingTedRepository,
    ).get(method((mock) => mock.update));
    const mockGetBankingTedByIdRepository: jest.Mock = On(
      bankingTedRepository,
    ).get(method((mock) => mock.getById));

    const bankingTedFailureRepository: BankingTedFailureRepository =
      createMock<BankingTedRepository>();
    const mockCreateBankingTedFailureRepository: jest.Mock = On(
      bankingTedFailureRepository,
    ).get(method((mock) => mock.create));

    return {
      bankingTedRepository,
      bankingTedFailureRepository,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
      mockCreateBankingTedFailureRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: BankingTedEventEmitter =
      createMock<BankingTedEventEmitter>();
    const mockFailedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.failedBankingTed),
    );

    return {
      eventEmitter,
      mockFailedEventEmitter,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockCreateAndAcceptOperationService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.createAndAcceptOperation));
    const mockGetWalletByUserAndDefaultIsTrueService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletByUserAndDefaultIsTrue));

    return {
      operationService,
      mockCreateAndAcceptOperationService,
      mockGetWalletByUserAndDefaultIsTrueService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle failed when id is null', async () => {
      const { sut } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should not handle failed when bankingTed not found', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const { id } = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
      );

      mockGetBankingTedByIdRepository.mockResolvedValueOnce(undefined);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(BankingTedNotFoundException);

      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(id);
    });

    it('TC0003 - Should not handle failed when bankingTed is already failed', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.FAILED },
      );
      bankingTed.isAlreadyFailedBankingTed = () => true;
      mockGetBankingTedByIdRepository.mockResolvedValueOnce(bankingTed);

      const result = await sut.execute(bankingTed.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.FAILED);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
    });

    it('TC0004 - Should not handle failed when status is not confirmed', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.WAITING },
      );

      mockGetBankingTedByIdRepository.mockResolvedValueOnce(bankingTed);

      const testScript = () => sut.execute(bankingTed.id);

      await expect(testScript).rejects.toThrow(BankingTedInvalidStateException);

      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
    });

    it('TC0005 - Should not handle failed when not found beneficiary default wallet', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetWalletByUserAndDefaultIsTrueService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.CONFIRMED },
      );

      mockGetBankingTedByIdRepository.mockResolvedValueOnce(bankingTed);
      mockGetWalletByUserAndDefaultIsTrueService.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(bankingTed.id);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);

      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(mockGetWalletByUserAndDefaultIsTrueService).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0006 - Should not handle failed when beneficiary default wallet is not active', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetWalletByUserAndDefaultIsTrueService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.CONFIRMED },
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.DEACTIVATE },
      );

      mockGetBankingTedByIdRepository.mockResolvedValueOnce(bankingTed);
      mockGetWalletByUserAndDefaultIsTrueService.mockResolvedValueOnce(wallet);

      const testScript = () => sut.execute(bankingTed.id);

      await expect(testScript).rejects.toThrow(WalletNotActiveException);

      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(mockGetWalletByUserAndDefaultIsTrueService).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should handle failed bankingTed and revert operation', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockUpdateBankingTedRepository,
        mockCreateAndAcceptOperationService,
        mockGetWalletByUserAndDefaultIsTrueService,
        mockFailedEventEmitter,
        mockCreateBankingTedFailureRepository,
        bankingTedFailureOperationTransactionTag,
        bankingTedFailureOperationDescription,
      } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.CONFIRMED },
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE, user: bankingTed.user },
      );

      mockGetBankingTedByIdRepository.mockResolvedValueOnce(bankingTed);
      mockGetWalletByUserAndDefaultIsTrueService.mockResolvedValueOnce(wallet);

      const result = await sut.execute(bankingTed.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.FAILED);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperationService).toBeCalledWith(
        bankingTedFailureOperationTransactionTag,
        expect.objectContaining({
          rawValue: bankingTed.amount,
          description: bankingTedFailureOperationDescription,
        }),
        null,
        expect.objectContaining(wallet),
      );
      expect(mockGetWalletByUserAndDefaultIsTrueService).toHaveBeenCalledTimes(
        1,
      );
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdateBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingTedFailureRepository).toHaveBeenCalledTimes(1);
    });
  });
});
