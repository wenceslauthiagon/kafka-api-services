import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  NotifyDebitEntity,
  NotifyDebitRepository,
} from '@zro/api-topazio/domain';
import { HandleNotifyDebitTopazioEventUseCase as UseCase } from '@zro/api-topazio/application';
import { NotifyDebitFactory } from '@zro/test/api-topazio/config';

describe('HandleNotifyDebitTopazioEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { notifyDebitRepository, mockCreateNotifyDebitRepository } =
      mockRepository();

    const sut = new UseCase(logger, notifyDebitRepository);
    return {
      sut,
      mockCreateNotifyDebitRepository,
    };
  };

  const mockRepository = () => {
    const notifyDebitRepository: NotifyDebitRepository =
      createMock<NotifyDebitRepository>();
    const mockCreateNotifyDebitRepository: jest.Mock = On(
      notifyDebitRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyDebitRepository,
      mockCreateNotifyDebitRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle notify debit when transaction id is null', async () => {
      const { sut } = makeSut();
      const notifyDebit = new NotifyDebitEntity({
        transactionId: null,
      });

      const testScript = () => sut.execute(notifyDebit);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should handle notify debit and save in database', async () => {
        const { sut, mockCreateNotifyDebitRepository } = makeSut();
        const data = await NotifyDebitFactory.create<NotifyDebitEntity>(
          NotifyDebitEntity.name,
        );
        const notifyDebit = new NotifyDebitEntity(data);

        const result = await sut.execute(notifyDebit);

        expect(result).toBeUndefined();
        expect(mockCreateNotifyDebitRepository).toHaveBeenCalledTimes(1);
      });
    });
  });
});
