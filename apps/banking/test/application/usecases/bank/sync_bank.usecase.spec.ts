import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common/test';
import { BankEntity, BankRepository } from '@zro/banking/domain';
import {
  BankEventEmitter,
  SyncBankUseCase as UseCase,
} from '@zro/banking/application';
import { BankFactory } from '@zro/test/banking/config';

describe('SyncBankUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      bankRepository,
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

    const zroBankIspb = '26264220';
    const sut = new UseCase(logger, bankRepository, eventEmitter, zroBankIspb);

    return {
      sut,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
      mockDeleteRepository,
      mockCreatedEventEmitter,
      mockUpdatedEventEmitter,
      mockDeletedEventEmitter,
      zroBankIspb,
    };
  };

  const mockRepository = () => {
    const bankRepository: BankRepository = createMock<BankRepository>();
    const mockGetRepository: jest.Mock = On(bankRepository).get(
      method((mock) => mock.getAllWithDeletedAt),
    );
    const mockCreateRepository: jest.Mock = On(bankRepository).get(
      method((mock) => mock.create),
    );
    const mockUpdateRepository: jest.Mock = On(bankRepository).get(
      method((mock) => mock.update),
    );
    const mockDeleteRepository: jest.Mock = On(bankRepository).get(
      method((mock) => mock.delete),
    );
    return {
      bankRepository,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
      mockDeleteRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: BankEventEmitter = createMock<BankEventEmitter>();
    const mockCreatedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.createdBank),
    );
    const mockUpdatedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.updatedBank),
    );
    const mockDeletedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.deletedBank),
    );
    return {
      eventEmitter,
      mockCreatedEventEmitter,
      mockUpdatedEventEmitter,
      mockDeletedEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should create new bank successfully', async () => {
      const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
      });

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

      await sut.execute([bank]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should update a bank successfully', async () => {
      const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
      });
      const newBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
        ispb: bank.ispb,
      });

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
      mockGetRepository.mockReturnValue([bank]);

      await sut.execute([newBank]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update the same bank', async () => {
      const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
      });

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
      mockGetRepository.mockReturnValue([bank]);

      await sut.execute([bank]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should delete a bank successfully', async () => {
      const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
      });
      const newBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
      });

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
      mockGetRepository.mockReturnValue([bank]);

      await sut.execute([newBank]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should not delete the zrobank ispb', async () => {
      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
        zroBankIspb,
      } = makeSut();

      const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
        ispb: zroBankIspb,
      });
      const newBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
      });

      mockGetRepository.mockReturnValue([bank]);

      await sut.execute([newBank]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should update a deleted bank successfully', async () => {
      const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
        deletedAt: new Date(),
      });
      const newBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        active: true,
        ispb: bank.ispb,
        deletedAt: null,
      });

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
      mockGetRepository.mockReturnValue([bank]);

      await sut.execute([newBank]);

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
    it('TC0007 - Should not create without new bank', async () => {
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
