import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  BankingTedEntity,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import {
  ConfirmBankingTedUseCase as UseCase,
  BankingTedEventEmitter,
  BankingTedInvalidStateException,
  BankingTedNotFoundException,
} from '@zro/banking/application';
import { BankingTedFactory } from '@zro/test/banking/config';

describe('ConfirmBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      bankingTedRepository,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockConfirmedEventEmitter } = mockEmitter();

    const sut = new UseCase(logger, bankingTedRepository, eventEmitter);
    return {
      sut,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
      mockConfirmedEventEmitter,
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
    ).get(method((mock) => mock.getByTransactionId));

    return {
      bankingTedRepository,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: BankingTedEventEmitter =
      createMock<BankingTedEventEmitter>();
    const mockConfirmedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.confirmedBankingTed),
    );

    return {
      eventEmitter,
      mockConfirmedEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle confirmed when id is null', async () => {
      const { sut } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should not handle confirmed when bankingTed not found', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
      );

      mockGetBankingTedByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(bankingTed);

      await expect(testScript).rejects.toThrow(BankingTedNotFoundException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.transactionId,
      );
    });

    it('TC0003 - Should not handle confirmed when bankingTed is already confirmed', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.CONFIRMED },
      );
      bankingTed.isAlreadyConfirmedBankingTed = () => true;
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);

      const result = await sut.execute(bankingTed);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.CONFIRMED);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.transactionId,
      );
    });

    it('TC0004 - Should not handle confirmed when status is not waiting', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.FORWARDED },
      );

      bankingTed.isAlreadyConfirmedBankingTed = () => false;
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);

      const testScript = () => sut.execute(bankingTed);

      expect(testScript).rejects.toThrow(BankingTedInvalidStateException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.transactionId,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should handle confirmed bankingTed', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockUpdateBankingTedRepository,
        mockConfirmedEventEmitter,
      } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.WAITING, beneficiaryAccountDigit: '' },
      );
      bankingTed.isAlreadyFailedBankingTed = () => false;
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);

      const result = await sut.execute(bankingTed);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.CONFIRMED);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.transactionId,
      );
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdateBankingTedRepository).toHaveBeenCalledTimes(1);
    });
  });
});
