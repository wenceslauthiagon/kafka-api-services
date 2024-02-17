import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  TranslateService,
} from '@zro/common';
import {
  FailedNotifyCreditRepository,
  NotifyCreditEntity,
  NotifyCreditRepository,
  StatusType,
  TransactionType,
} from '@zro/api-topazio/domain';
import {
  HandleNotifyCreditTopazioEventUseCase as UseCase,
  NotifyInvalidStatusException,
  NotifyInvalidtransactionTypeException,
} from '@zro/api-topazio/application';
import { PixPaymentServiceKafka } from '@zro/api-topazio/infrastructure';
import { NotifyCreditFactory } from '@zro/test/api-topazio/config';
import { BankNotFoundException } from '@zro/pix-payments/application';

describe('HandleNotifyCreditTopazioEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      notifyCreditRepository,
      mockCreateNotifyCreditRepository,
      failedNotifyCreditRepository,
      mockCreateFailedNotifyCredit,
    } = mockRepository();
    const {
      pixPaymentService,
      mockReceivePixDepositService,
      mockReceivePixDevolutionService,
      mockReceivePixPaymentChargebackService,
      mockReceivePixDevolutionChargebackService,
      translateService,
    } = mockService();

    const sut = new UseCase(
      logger,
      notifyCreditRepository,
      pixPaymentService,
      failedNotifyCreditRepository,
      translateService,
    );
    return {
      sut,
      mockReceivePixDepositService,
      mockReceivePixDevolutionService,
      mockReceivePixPaymentChargebackService,
      mockReceivePixDevolutionChargebackService,
      mockCreateNotifyCreditRepository,
      mockCreateFailedNotifyCredit,
    };
  };

  const mockRepository = () => {
    const notifyCreditRepository: NotifyCreditRepository =
      createMock<NotifyCreditRepository>();
    const mockCreateNotifyCreditRepository: jest.Mock = On(
      notifyCreditRepository,
    ).get(method((mock) => mock.create));

    const failedNotifyCreditRepository: FailedNotifyCreditRepository =
      createMock<FailedNotifyCreditRepository>();
    const mockCreateFailedNotifyCredit: jest.Mock = On(
      failedNotifyCreditRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyCreditRepository,
      mockCreateNotifyCreditRepository,
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
    const mockReceivePixDevolutionService: jest.Mock = On(
      pixPaymentService,
    ).get(method((mock) => mock.receivePixDevolution));
    const mockReceivePixPaymentChargebackService: jest.Mock = On(
      pixPaymentService,
    ).get(method((mock) => mock.receivePixPaymentChargeback));
    const mockReceivePixDevolutionChargebackService: jest.Mock = On(
      pixPaymentService,
    ).get(method((mock) => mock.receivePixDevolutionChargeback));

    const translateService: TranslateService = createMock<TranslateService>();

    return {
      pixPaymentService,
      mockReceivePixDepositService,
      mockReceivePixDevolutionService,
      mockReceivePixPaymentChargebackService,
      mockReceivePixDevolutionChargebackService,
      translateService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle notify credit when transaction id is null', async () => {
      const {
        sut,
        mockCreateNotifyCreditRepository,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();
      const notifyCredit = new NotifyCreditEntity({
        transactionId: null,
      });

      const testScript = () => sut.execute(notifyCredit);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not handle notify credit when isDevolution is null', async () => {
      const {
        sut,
        mockCreateNotifyCreditRepository,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();
      const notifyCredit = new NotifyCreditEntity({
        transactionId: uuidV4(),
      });

      const testScript = () => sut.execute(notifyCredit);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle notify credit when transactionType is null', async () => {
      const {
        sut,
        mockCreateNotifyCreditRepository,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();
      const notifyCredit = new NotifyCreditEntity({
        transactionId: uuidV4(),
      });

      const testScript = () => sut.execute(notifyCredit);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not handle notify credit when invalid status', async () => {
      const {
        sut,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockCreateNotifyCreditRepository,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();
      const notifyCredit = new NotifyCreditEntity({
        transactionId: uuidV4(),
        status: StatusType.ERROR,
        isDevolution: false,
        transactionType: TransactionType.CREDIT,
      });

      const testScript = () => sut.execute(notifyCredit);

      await expect(testScript).rejects.toThrow(NotifyInvalidStatusException);
      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not handle notify credit when invalid transactionType', async () => {
      const {
        sut,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockCreateNotifyCreditRepository,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();
      const notifyCredit = new NotifyCreditEntity({
        transactionId: uuidV4(),
        status: StatusType.SUCCESS,
        isDevolution: false,
      });

      Object.assign(notifyCredit, { transactionType: 'test' });

      const testScript = () => sut.execute(notifyCredit);

      await expect(testScript).rejects.toThrow(
        NotifyInvalidtransactionTypeException,
      );
      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should handle notify credit when devolution is false)', async () => {
      const {
        sut,
        mockCreateNotifyCreditRepository,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();

      const data = await NotifyCreditFactory.create<NotifyCreditEntity>(
        NotifyCreditEntity.name,
        { status: StatusType.SUCCESS, isDevolution: false },
      );

      await sut.execute(data);

      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(1);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should handle notify credit when devolution is true', async () => {
      const {
        sut,
        mockCreateNotifyCreditRepository,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();

      const data = await NotifyCreditFactory.create<NotifyCreditEntity>(
        NotifyCreditEntity.name,
        { status: StatusType.SUCCESS, isDevolution: true },
      );

      await sut.execute(data);

      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(1);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should handle notify chargeback when devolution is true', async () => {
      const {
        sut,
        mockCreateNotifyCreditRepository,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();

      const data = await NotifyCreditFactory.create<NotifyCreditEntity>(
        NotifyCreditEntity.name,
        {
          status: StatusType.SUCCESS,
          isDevolution: true,
          transactionType: TransactionType.CHARGEBACK,
        },
      );

      await sut.execute(data);

      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should handle notify chargeback when devolution is false', async () => {
      const {
        sut,
        mockCreateNotifyCreditRepository,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();

      const data = await NotifyCreditFactory.create<NotifyCreditEntity>(
        NotifyCreditEntity.name,
        {
          status: StatusType.SUCCESS,
          isDevolution: false,
          transactionType: TransactionType.CHARGEBACK,
        },
      );

      await sut.execute(data);

      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(1);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should handle created failed notify credit and devolve deposit', async () => {
      const {
        sut,
        mockCreateNotifyCreditRepository,
        mockReceivePixDepositService,
        mockReceivePixDevolutionService,
        mockReceivePixPaymentChargebackService,
        mockReceivePixDevolutionChargebackService,
        mockCreateFailedNotifyCredit,
      } = makeSut();

      const data = await NotifyCreditFactory.create<NotifyCreditEntity>(
        NotifyCreditEntity.name,
        { status: StatusType.SUCCESS, isDevolution: false },
      );

      mockReceivePixDepositService.mockRejectedValueOnce(
        new BankNotFoundException({
          ispb: data.thirdPartIspb,
        }),
      );

      await sut.execute(data);

      expect(mockCreateNotifyCreditRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivePixDepositService).toHaveBeenCalledTimes(1);
      expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixPaymentChargebackService).toHaveBeenCalledTimes(0);
      expect(mockReceivePixDevolutionChargebackService).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(1);
    });
  });
});
