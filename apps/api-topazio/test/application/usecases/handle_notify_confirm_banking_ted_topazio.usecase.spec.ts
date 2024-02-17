import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  NotifyConfirmBankingTedEntity,
  NotifyConfirmBankingTedRepository,
} from '@zro/api-topazio/domain';
import { HandleNotifyConfirmBankingTedTopazioEventUseCase as UseCase } from '@zro/api-topazio/application';
import { NotifyConfirmBankingTedFactory } from '@zro/test/api-topazio/config';

describe('HandleNotifyConfirmBankingTedTopazioEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      notifyConfirmBankingTedRepository,
      mockCreateNotifyConfirmBankingTedRepository,
    } = mockRepository();

    const sut = new UseCase(logger, notifyConfirmBankingTedRepository);
    return {
      sut,
      mockCreateNotifyConfirmBankingTedRepository,
    };
  };

  const mockRepository = () => {
    const notifyConfirmBankingTedRepository: NotifyConfirmBankingTedRepository =
      createMock<NotifyConfirmBankingTedRepository>();
    const mockCreateNotifyConfirmBankingTedRepository: jest.Mock = On(
      notifyConfirmBankingTedRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyConfirmBankingTedRepository,
      mockCreateNotifyConfirmBankingTedRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle notify confirm when transaction id is null', async () => {
      const { sut, mockCreateNotifyConfirmBankingTedRepository } = makeSut();
      const notifyConfirmBankingTed = new NotifyConfirmBankingTedEntity({
        transactionId: null,
      });

      const testScript = () => sut.execute(notifyConfirmBankingTed);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateNotifyConfirmBankingTedRepository).toHaveBeenCalledTimes(
        0,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should handle notify confirm', async () => {
      const { sut, mockCreateNotifyConfirmBankingTedRepository } = makeSut();

      const notifyConfirmBankingTed =
        await NotifyConfirmBankingTedFactory.create<NotifyConfirmBankingTedEntity>(
          NotifyConfirmBankingTedEntity.name,
        );

      await sut.execute(notifyConfirmBankingTed);

      expect(mockCreateNotifyConfirmBankingTedRepository).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
