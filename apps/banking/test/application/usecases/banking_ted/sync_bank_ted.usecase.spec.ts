import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { BankTedEntity, BankTedRepository } from '@zro/banking/domain';
import {
  BankTedEventEmitter,
  SyncBankTedUseCase as UseCase,
} from '@zro/banking/application';
import { BankTedFactory } from '@zro/test/banking/config';

describe('SyncBankTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      bankTedRepository,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
      mockDeleteRepository,
    } = mockRepository();
    const {
      eventEmitter,
      mockCreatedEventEmitter,
      mockUpdatedEventEmitter,
      mockDeletedEventEmitter,
    } = mockEvent();

    const zroBankTedIspb = '26264220';
    const sut = new UseCase(
      logger,
      bankTedRepository,
      eventEmitter,
      zroBankTedIspb,
    );

    return {
      sut,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
      mockDeleteRepository,
      mockCreatedEventEmitter,
      mockUpdatedEventEmitter,
      mockDeletedEventEmitter,
      zroBankTedIspb,
    };
  };

  const mockRepository = () => {
    const bankTedRepository: BankTedRepository =
      createMock<BankTedRepository>();
    const mockGetRepository: jest.Mock = On(bankTedRepository).get(
      method((mock) => mock.getAllWithDeletedAt),
    );
    const mockCreateRepository: jest.Mock = On(bankTedRepository).get(
      method((mock) => mock.create),
    );
    const mockUpdateRepository: jest.Mock = On(bankTedRepository).get(
      method((mock) => mock.update),
    );
    const mockDeleteRepository: jest.Mock = On(bankTedRepository).get(
      method((mock) => mock.delete),
    );
    return {
      bankTedRepository,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
      mockDeleteRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: BankTedEventEmitter = createMock<BankTedEventEmitter>();
    const mockCreatedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.createdBankTed),
    );
    const mockUpdatedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.updatedBankTed),
    );
    const mockDeletedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.deletedBankTed),
    );
    return {
      eventEmitter,
      mockCreatedEventEmitter,
      mockUpdatedEventEmitter,
      mockDeletedEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should create new bankTed successfully', async () => {
      const bankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true },
      );

      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();
      mockGetRepository.mockReturnValue([]);

      await sut.execute([bankTed]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should update a bankTed successfully', async () => {
      const bankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true },
      );
      const newBankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true, ispb: bankTed.ispb },
      );

      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();
      mockGetRepository.mockReturnValue([bankTed]);

      await sut.execute([newBankTed]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update the same bankTed', async () => {
      const bankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true },
      );

      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();
      mockGetRepository.mockReturnValue([bankTed]);

      await sut.execute([bankTed]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should delete a bankTed successfully', async () => {
      const bankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true },
      );
      const newBankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true },
      );

      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();
      mockGetRepository.mockReturnValue([bankTed]);

      await sut.execute([newBankTed]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should not delete the zrobankTed code', async () => {
      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
        zroBankTedIspb,
      } = makeSut();

      const bankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true, code: zroBankTedIspb },
      );
      const newBankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true },
      );

      mockGetRepository.mockReturnValue([bankTed]);

      await sut.execute([newBankTed]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should update a deleted bankTed successfully', async () => {
      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();

      const bankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true, deletedAt: new Date() },
      );
      const newBankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
        { active: true, ispb: bankTed.ispb, deletedAt: null },
      );

      mockGetRepository.mockReturnValue([bankTed]);

      await sut.execute([newBankTed]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository.mock.calls[0][0].deletedAt).toBeNull();
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0007 - Should not create without new bankTed', async () => {
      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();

      await sut.execute(null);

      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
