import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, TranslateService } from '@zro/common';
import {
  FailedNotifyCreditRepository,
  PixStatementEntity,
  PixStatementRepository,
} from '@zro/api-topazio/domain';
import {
  PixPaymentService,
  SyncPixStatementUseCase as UseCase,
} from '@zro/api-topazio/application';
import { PixStatementFactory } from '@zro/test/api-topazio/config';
import { BankNotFoundException } from '@zro/pix-payments/application';

describe('SyncPixStatementUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const zroBankIspb = '26264220';

  const makeSut = () => {
    const {
      pixStatementRepository,
      mockUpdatePixStatement,
      mockGetAllPixStatement,
      failedNotifyCreditRepository,
      mockCreateFailedNotifyCredit,
    } = mockRepository();

    const {
      pixPaymentService,
      mockPixDepositService,
      mockPixDevolutionService,
      translateService,
    } = mockService();

    const sut = new UseCase(
      logger,
      pixPaymentService,
      pixStatementRepository,
      failedNotifyCreditRepository,
      zroBankIspb,
      translateService,
    );
    return {
      sut,
      mockUpdatePixStatement,
      mockGetAllPixStatement,
      mockPixDepositService,
      mockPixDevolutionService,
      mockCreateFailedNotifyCredit,
    };
  };

  const mockRepository = () => {
    const pixStatementRepository: PixStatementRepository =
      createMock<PixStatementRepository>();
    const mockUpdatePixStatement: jest.Mock = On(pixStatementRepository).get(
      method((mock) => mock.update),
    );
    const mockGetAllPixStatement: jest.Mock = On(pixStatementRepository).get(
      method((mock) => mock.getAll),
    );

    const failedNotifyCreditRepository: FailedNotifyCreditRepository =
      createMock<FailedNotifyCreditRepository>();
    const mockCreateFailedNotifyCredit: jest.Mock = On(
      failedNotifyCreditRepository,
    ).get(method((mock) => mock.create));

    return {
      pixStatementRepository,
      mockUpdatePixStatement,
      mockGetAllPixStatement,
      failedNotifyCreditRepository,
      mockCreateFailedNotifyCredit,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();
    const mockPixDepositService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.receivePixDeposit),
    );
    const mockPixDevolutionService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.receivePixDevolution),
    );

    const translateService: TranslateService = createMock<TranslateService>();

    return {
      pixPaymentService,
      mockPixDepositService,
      mockPixDevolutionService,
      translateService,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should sync pix statement when pix deposit', async () => {
      const {
        sut,
        mockUpdatePixStatement,
        mockGetAllPixStatement,
        mockPixDepositService,
        mockPixDevolutionService,
        mockCreateFailedNotifyCredit,
      } = makeSut();

      const pixStatements =
        await PixStatementFactory.createMany<PixStatementEntity>(
          PixStatementEntity.name,
          2,
        );

      mockGetAllPixStatement.mockResolvedValue(pixStatements);

      await sut.execute();

      expect(mockUpdatePixStatement).toHaveBeenCalledTimes(2);
      expect(mockGetAllPixStatement).toHaveBeenCalledTimes(1);
      expect(mockPixDepositService).toHaveBeenCalledTimes(2);
      expect(mockPixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should sync pix statement when pix devolution', async () => {
      const {
        sut,
        mockUpdatePixStatement,
        mockGetAllPixStatement,
        mockPixDepositService,
        mockPixDevolutionService,
        mockCreateFailedNotifyCredit,
      } = makeSut();

      const pixStatements =
        await PixStatementFactory.createMany<PixStatementEntity>(
          PixStatementEntity.name,
          2,
        );

      pixStatements[0].statements[0].isDevolution = true;
      pixStatements[1].statements[0].isDevolution = true;

      mockGetAllPixStatement.mockResolvedValue(pixStatements);

      await sut.execute();

      expect(mockUpdatePixStatement).toHaveBeenCalledTimes(2);
      expect(mockGetAllPixStatement).toHaveBeenCalledTimes(1);
      expect(mockPixDepositService).toHaveBeenCalledTimes(0);
      expect(mockPixDevolutionService).toHaveBeenCalledTimes(2);
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should create failed notify credit when pix deposit is invalid and devolve deposit', async () => {
      const {
        sut,
        mockUpdatePixStatement,
        mockGetAllPixStatement,
        mockPixDepositService,
        mockPixDevolutionService,
        mockCreateFailedNotifyCredit,
      } = makeSut();

      const pixStatements =
        await PixStatementFactory.createMany<PixStatementEntity>(
          PixStatementEntity.name,
          2,
        );

      mockGetAllPixStatement.mockResolvedValue(pixStatements);

      mockPixDepositService.mockRejectedValue(
        new BankNotFoundException({ ispb: 'test' }),
      );

      await sut.execute();

      expect(mockUpdatePixStatement).toHaveBeenCalledTimes(2);
      expect(mockGetAllPixStatement).toHaveBeenCalledTimes(1);
      expect(mockPixDepositService).toHaveBeenCalledTimes(2);
      expect(mockPixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(2);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0004 - Should not sync pix statement when not found', async () => {
      const {
        sut,
        mockUpdatePixStatement,
        mockGetAllPixStatement,
        mockPixDepositService,
        mockPixDevolutionService,
        mockCreateFailedNotifyCredit,
      } = makeSut();

      mockGetAllPixStatement.mockResolvedValue([]);

      await sut.execute();

      expect(mockUpdatePixStatement).toHaveBeenCalledTimes(0);
      expect(mockGetAllPixStatement).toHaveBeenCalledTimes(1);
      expect(mockPixDepositService).toHaveBeenCalledTimes(0);
      expect(mockPixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCreateFailedNotifyCredit).toHaveBeenCalledTimes(0);
    });
  });
});
