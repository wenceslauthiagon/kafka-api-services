import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  TranslateService,
} from '@zro/common';
import {
  FailedNotifyCreditRepository,
  NotifyCreditDepositEntity,
  NotifyCreditDepositRepository,
} from '@zro/api-jdpi/domain';
import { PixDepositReceivedBankNotAllowedException } from '@zro/pix-payments/application';
import { HandleNotifyCreditDepositJdpiEventUseCase as UseCase } from '@zro/api-jdpi/application';
import { PixPaymentServiceKafka } from '@zro/api-jdpi/infrastructure';
import { NotifyCreditDepositFactory } from '@zro/test/api-jdpi/config';

describe('HandleNotifyCreditDepositJdpiEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyCreditDepositRepository,
      mockCreateNotifyCreditDepositRepository,
      failedNotifyCreditRepository,
      mockCreateFailedNotifyCredit,
    } = mockRepository();
    const {
      pixPaymentService,
      mockReceivePixDepositService,
      translateService,
    } = mockService();

    const sut = new UseCase(
      logger,
      notifyCreditDepositRepository,
      pixPaymentService,
      failedNotifyCreditRepository,
      translateService,
    );
    return {
      sut,
      mockReceivePixDepositService,
      mockCreateNotifyCreditDepositRepository,
      mockCreateFailedNotifyCredit,
    };
  };

  const mockRepository = () => {
    const notifyCreditDepositRepository: NotifyCreditDepositRepository =
      createMock<NotifyCreditDepositRepository>();
    const mockCreateNotifyCreditDepositRepository: jest.Mock = On(
      notifyCreditDepositRepository,
    ).get(method((mock) => mock.create));

    const failedNotifyCreditRepository: FailedNotifyCreditRepository =
      createMock<FailedNotifyCreditRepository>();
    const mockCreateFailedNotifyCredit: jest.Mock = On(
      failedNotifyCreditRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyCreditDepositRepository,
      mockCreateNotifyCreditDepositRepository,
      failedNotifyCreditRepository,
      mockCreateFailedNotifyCredit,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentServiceKafka =
      createMock<PixPaymentServiceKafka>();
    const mockReceivePixDepositService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.receivePixDeposit),
    );
    const translateService: TranslateService = createMock<TranslateService>();

    return {
      pixPaymentService,
      mockReceivePixDepositService,
      translateService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle notify credit deposit when missing params.', async () => {
      const {
        sut,
        mockCreateNotifyCreditDepositRepository,
        mockReceivePixDepositService,
        mockCreateFailedNotifyCredit,
      } = makeSut();
      const notifyCreditDeposit =
        await NotifyCreditDepositFactory.create<NotifyCreditDepositEntity>(
          NotifyCreditDepositEntity.name,
          {
            externalId: null,
          },
        );

      const testScript = () => sut.execute(notifyCreditDeposit);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateNotifyCreditDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should save failed notify credit deposit when handleCreditDeposit throws.', async () => {
        const {
          sut,
          mockCreateNotifyCreditDepositRepository,
          mockReceivePixDepositService,
          mockCreateFailedNotifyCredit,
        } = makeSut();
        const notifyCreditDeposit =
          await NotifyCreditDepositFactory.create<NotifyCreditDepositEntity>(
            NotifyCreditDepositEntity.name,
          );

        mockCreateNotifyCreditDepositRepository.mockResolvedValue(
          notifyCreditDeposit,
        );

        mockReceivePixDepositService.mockRejectedValue(
          PixDepositReceivedBankNotAllowedException,
        );

        const testScript = await sut.execute(notifyCreditDeposit);

        expect(testScript).toBeUndefined();
        expect(mockCreateNotifyCreditDepositRepository).toHaveBeenCalledTimes(
          1,
        );
        expect(mockReceivePixDepositService).toHaveBeenCalledTimes(1);
        expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should handle notify credit deposit.', async () => {
        const {
          sut,
          mockCreateNotifyCreditDepositRepository,
          mockReceivePixDepositService,
          mockCreateFailedNotifyCredit,
        } = makeSut();
        const notifyCreditDeposit =
          await NotifyCreditDepositFactory.create<NotifyCreditDepositEntity>(
            NotifyCreditDepositEntity.name,
          );

        mockCreateNotifyCreditDepositRepository.mockResolvedValue(
          notifyCreditDeposit,
        );

        const testScript = await sut.execute(notifyCreditDeposit);

        expect(testScript).toBeUndefined();
        expect(mockCreateNotifyCreditDepositRepository).toHaveBeenCalledTimes(
          1,
        );
        expect(mockReceivePixDepositService).toHaveBeenCalledTimes(1);
        expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
      });
    });
  });
});
