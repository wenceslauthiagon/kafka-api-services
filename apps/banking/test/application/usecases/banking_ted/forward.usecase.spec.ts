import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  BankingTedEntity,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import {
  ForwardBankingTedUseCase as UseCase,
  BankingTedEventEmitter,
  BankingTedInvalidStateException,
  BankingTedNotFoundException,
} from '@zro/banking/application';
import { BankingTedFactory } from '@zro/test/banking/config';

describe('ForwardBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      bankingTedRepository,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockForwardedEventEmitter } = mockEmitter();

    const sut = new UseCase(logger, bankingTedRepository, eventEmitter);
    return {
      sut,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
      mockForwardedEventEmitter,
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

    return {
      bankingTedRepository,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: BankingTedEventEmitter =
      createMock<BankingTedEventEmitter>();
    const mockForwardedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.forwardedBankingTed),
    );

    return {
      eventEmitter,
      mockForwardedEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle forwarded when id is null', async () => {
      const { sut } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should not handle forwarded when bankingTed not found', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const { id } = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
      );

      mockGetBankingTedByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(BankingTedNotFoundException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(id);
    });

    it('TC0003 - Should not handle forwarded when bankingTed is already forwarded', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.FORWARDED },
      );
      bankingTed.isAlreadyForwardedBankingTed = () => true;
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);

      const result = await sut.execute(bankingTed.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.FORWARDED);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
    });

    it('TC0004 - Should not handle forwarded when status is not confirmed', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.WAITING },
      );
      bankingTed.isAlreadyForwardedBankingTed = () => false;
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);

      const testScript = () => sut.execute(bankingTed.id);

      expect(testScript).rejects.toThrow(BankingTedInvalidStateException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should handle forwarded bankingTed', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockUpdateBankingTedRepository,
        mockForwardedEventEmitter,
      } = makeSut();
      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.CONFIRMED },
      );
      bankingTed.isAlreadyForwardedBankingTed = () => false;
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);

      const result = await sut.execute(bankingTed.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.FORWARDED);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(mockForwardedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdateBankingTedRepository).toHaveBeenCalledTimes(1);
    });
  });
});
