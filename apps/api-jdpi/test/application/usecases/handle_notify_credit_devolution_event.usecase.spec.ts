import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  TranslateService,
} from '@zro/common';
import {
  FailedNotifyCreditRepository,
  NotifyCreditDevolutionEntity,
  NotifyCreditDevolutionRepository,
} from '@zro/api-jdpi/domain';
import { HandleNotifyCreditDevolutionJdpiEventUseCase as UseCase } from '@zro/api-jdpi/application';
import { PixDevolutionReceivedBankNotAllowedException } from '@zro/pix-payments/application';
import { PixPaymentServiceKafka } from '@zro/api-jdpi/infrastructure';
import { NotifyCreditDevolutionFactory } from '@zro/test/api-jdpi/config';

describe('HandleNotifyCreditDevolutionJdpiEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyCreditDevolutionRepository,
      mockCreateNotifyCreditDevolutionRepository,
      failedNotifyCreditRepository,
      mockCreateFailedNotifyCredit,
    } = mockRepository();
    const {
      pixPaymentService,
      mockReceivePixDevolutionService,
      translateService,
    } = mockService();

    const sut = new UseCase(
      logger,
      notifyCreditDevolutionRepository,
      pixPaymentService,
      failedNotifyCreditRepository,
      translateService,
    );
    return {
      sut,
      mockReceivePixDevolutionService,
      mockCreateNotifyCreditDevolutionRepository,
      mockCreateFailedNotifyCredit,
    };
  };

  const mockRepository = () => {
    const notifyCreditDevolutionRepository: NotifyCreditDevolutionRepository =
      createMock<NotifyCreditDevolutionRepository>();
    const mockCreateNotifyCreditDevolutionRepository: jest.Mock = On(
      notifyCreditDevolutionRepository,
    ).get(method((mock) => mock.create));

    const failedNotifyCreditRepository: FailedNotifyCreditRepository =
      createMock<FailedNotifyCreditRepository>();
    const mockCreateFailedNotifyCredit: jest.Mock = On(
      failedNotifyCreditRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyCreditDevolutionRepository,
      mockCreateNotifyCreditDevolutionRepository,
      failedNotifyCreditRepository,
      mockCreateFailedNotifyCredit,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentServiceKafka =
      createMock<PixPaymentServiceKafka>();
    const mockReceivePixDevolutionService: jest.Mock = On(
      pixPaymentService,
    ).get(method((mock) => mock.receivePixDevolution));
    const translateService: TranslateService = createMock<TranslateService>();

    return {
      pixPaymentService,
      mockReceivePixDevolutionService,
      translateService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle notify credit devolution when missing params', async () => {
      const {
        sut,
        mockCreateNotifyCreditDevolutionRepository,
        mockReceivePixDevolutionService,
        mockCreateFailedNotifyCredit,
      } = makeSut();
      const notifyCreditDevolution =
        await NotifyCreditDevolutionFactory.create<NotifyCreditDevolutionEntity>(
          NotifyCreditDevolutionEntity.name,
          { externalId: null },
        );

      const testScript = () => sut.execute(notifyCreditDevolution);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateNotifyCreditDevolutionRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should save failed notify credit devolution when handleCreditDeposit throws', async () => {
        const {
          sut,
          mockCreateNotifyCreditDevolutionRepository,
          mockReceivePixDevolutionService,
          mockCreateFailedNotifyCredit,
        } = makeSut();
        const notifyCreditDevolution =
          await NotifyCreditDevolutionFactory.create<NotifyCreditDevolutionEntity>(
            NotifyCreditDevolutionEntity.name,
          );

        mockCreateNotifyCreditDevolutionRepository.mockResolvedValue(
          notifyCreditDevolution,
        );

        mockReceivePixDevolutionService.mockRejectedValue(
          PixDevolutionReceivedBankNotAllowedException,
        );

        const testScript = await sut.execute(notifyCreditDevolution);

        expect(testScript).toBeUndefined();
        expect(
          mockCreateNotifyCreditDevolutionRepository,
        ).toHaveBeenCalledTimes(1);
        expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(1);
        expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should handle notify credit devolution', async () => {
        const {
          sut,
          mockCreateNotifyCreditDevolutionRepository,
          mockReceivePixDevolutionService,
          mockCreateFailedNotifyCredit,
        } = makeSut();
        const notifyCreditDevolution =
          await NotifyCreditDevolutionFactory.create<NotifyCreditDevolutionEntity>(
            NotifyCreditDevolutionEntity.name,
          );

        mockCreateNotifyCreditDevolutionRepository.mockResolvedValue(
          notifyCreditDevolution,
        );

        const testScript = await sut.execute(notifyCreditDevolution);

        expect(testScript).toBeUndefined();
        expect(
          mockCreateNotifyCreditDevolutionRepository,
        ).toHaveBeenCalledTimes(1);
        expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(1);
        expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
      });
    });
  });
});
