import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  NotifyRegisterBankingTedEntity,
  NotifyRegisterBankingTedRepository,
  NotifyRegisterBankingTedStatus,
} from '@zro/api-topazio/domain';
import {
  NotifyBankingTedNotFoundException,
  HandleNotifyRegisterBankingTedTopazioEventUseCase as UseCase,
} from '@zro/api-topazio/application';
import {
  BankingServiceKafka,
  AdminBankingServiceKafka,
} from '@zro/api-topazio/infrastructure';
import { NotifyRegisterBankingTedFactory } from '@zro/test/api-topazio/config';

describe('HandleNotifyRegisterBankingTedTopazioEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      notifyRegisterBankingTedRepository,
      mockCreateNotifyRegisterBankingTedRepository,
    } = mockRepository();
    const {
      bankingService,
      mockGetBankingService,
      mockRejectBankingService,
      mockForwardBankingService,
      adminBankingService,
      mockGetAdminBankingService,
      mockRejectAdminBankingService,
      mockForwardAdminBankingService,
    } = mockService();

    const sut = new UseCase(
      logger,
      notifyRegisterBankingTedRepository,
      bankingService,
      adminBankingService,
    );
    return {
      sut,
      mockCreateNotifyRegisterBankingTedRepository,
      mockGetBankingService,
      mockRejectBankingService,
      mockForwardBankingService,
      mockGetAdminBankingService,
      mockRejectAdminBankingService,
      mockForwardAdminBankingService,
    };
  };

  const mockRepository = () => {
    const notifyRegisterBankingTedRepository: NotifyRegisterBankingTedRepository =
      createMock<NotifyRegisterBankingTedRepository>();
    const mockCreateNotifyRegisterBankingTedRepository: jest.Mock = On(
      notifyRegisterBankingTedRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyRegisterBankingTedRepository,
      mockCreateNotifyRegisterBankingTedRepository,
    };
  };

  const mockService = () => {
    const bankingService: BankingServiceKafka =
      createMock<BankingServiceKafka>();
    const mockGetBankingService: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankingTedByTransactionId),
    );
    const mockRejectBankingService: jest.Mock = On(bankingService).get(
      method((mock) => mock.rejectBankingTed),
    );
    const mockForwardBankingService: jest.Mock = On(bankingService).get(
      method((mock) => mock.forwardBankingTed),
    );

    const adminBankingService: AdminBankingServiceKafka =
      createMock<AdminBankingServiceKafka>();
    const mockGetAdminBankingService: jest.Mock = On(adminBankingService).get(
      method((mock) => mock.getAdminBankingTedByTransactionId),
    );
    const mockRejectAdminBankingService: jest.Mock = On(
      adminBankingService,
    ).get(method((mock) => mock.rejectAdminBankingTed));
    const mockForwardAdminBankingService: jest.Mock = On(
      adminBankingService,
    ).get(method((mock) => mock.forwardAdminBankingTed));

    return {
      bankingService,
      mockGetBankingService,
      mockRejectBankingService,
      mockForwardBankingService,
      adminBankingService,
      mockGetAdminBankingService,
      mockRejectAdminBankingService,
      mockForwardAdminBankingService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle notify register when transaction id is null', async () => {
      const {
        sut,
        mockCreateNotifyRegisterBankingTedRepository,
        mockGetBankingService,
        mockRejectBankingService,
        mockForwardBankingService,
      } = makeSut();
      const notifyRegisterBankingTed = new NotifyRegisterBankingTedEntity({
        transactionId: null,
      });

      const testScript = () => sut.execute(notifyRegisterBankingTed);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(
        mockCreateNotifyRegisterBankingTedRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
      expect(mockRejectBankingService).toHaveBeenCalledTimes(0);
      expect(mockForwardBankingService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not handle notify register when ted not found', async () => {
      const {
        sut,
        mockCreateNotifyRegisterBankingTedRepository,
        mockGetBankingService,
        mockRejectBankingService,
        mockForwardBankingService,
        mockGetAdminBankingService,
        mockForwardAdminBankingService,
        mockRejectAdminBankingService,
      } = makeSut();
      const notifyRegisterBankingTed = new NotifyRegisterBankingTedEntity({
        transactionId: uuidV4(),
        status: NotifyRegisterBankingTedStatus.TED_FORWARDED,
      });

      mockGetBankingService.mockResolvedValueOnce(null);
      mockGetAdminBankingService.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(notifyRegisterBankingTed);

      await expect(testScript).rejects.toThrow(
        NotifyBankingTedNotFoundException,
      );
      expect(
        mockCreateNotifyRegisterBankingTedRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingService).toHaveBeenCalledTimes(1);
      expect(mockRejectBankingService).toHaveBeenCalledTimes(0);
      expect(mockForwardBankingService).toHaveBeenCalledTimes(0);
      expect(mockForwardAdminBankingService).toHaveBeenCalledTimes(0);
      expect(mockRejectAdminBankingService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle notify register when status is not used', async () => {
      const {
        sut,
        mockCreateNotifyRegisterBankingTedRepository,
        mockGetBankingService,
        mockRejectBankingService,
        mockForwardBankingService,
      } = makeSut();
      const notifyRegisterBankingTed = new NotifyRegisterBankingTedEntity({
        transactionId: uuidV4(),
        status: NotifyRegisterBankingTedStatus.TED_RECEIVED,
      });
      mockGetBankingService.mockImplementationOnce((id) => ({ id }));

      await sut.execute(notifyRegisterBankingTed);

      expect(
        mockCreateNotifyRegisterBankingTedRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockRejectBankingService).toHaveBeenCalledTimes(0);
      expect(mockForwardBankingService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should handle notify register when forwarded', async () => {
      const {
        sut,
        mockCreateNotifyRegisterBankingTedRepository,
        mockGetBankingService,
        mockRejectBankingService,
        mockForwardBankingService,
      } = makeSut();

      const notifyRegisterBankingTed =
        await NotifyRegisterBankingTedFactory.create<NotifyRegisterBankingTedEntity>(
          NotifyRegisterBankingTedEntity.name,
          {
            status: NotifyRegisterBankingTedStatus.TED_FORWARDED,
          },
        );
      mockGetBankingService.mockImplementationOnce((id) => ({ id }));

      await sut.execute(notifyRegisterBankingTed);

      expect(
        mockCreateNotifyRegisterBankingTedRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockRejectBankingService).toHaveBeenCalledTimes(0);
      expect(mockForwardBankingService).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should handle notify register when failed', async () => {
      const {
        sut,
        mockCreateNotifyRegisterBankingTedRepository,
        mockGetBankingService,
        mockRejectBankingService,
        mockForwardBankingService,
      } = makeSut();

      const notifyRegisterBankingTed =
        await NotifyRegisterBankingTedFactory.create<NotifyRegisterBankingTedEntity>(
          NotifyRegisterBankingTedEntity.name,
          {
            status: NotifyRegisterBankingTedStatus.TED_NOT_DONE,
          },
        );
      mockGetBankingService.mockImplementationOnce((id) => ({ id }));

      await sut.execute(notifyRegisterBankingTed);

      expect(
        mockCreateNotifyRegisterBankingTedRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockRejectBankingService).toHaveBeenCalledTimes(1);
      expect(mockForwardBankingService).toHaveBeenCalledTimes(0);
    });
  });
});
