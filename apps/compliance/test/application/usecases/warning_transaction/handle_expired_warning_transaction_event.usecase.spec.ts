import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  WarningTransactionEntity,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  HandleExpiredWarningTransactionEventUseCase as UseCase,
  WarningTransactionEventEmitter,
  WarningTransactionGateway,
  WarningTransactionNotFoundException,
} from '@zro/compliance/application';
import { WarningTransactionFactory } from '@zro/test/compliance/config';

describe('HandleExpiredWarningTransactionEventUseCase', () => {
  const makeSut = () => {
    const warningTransactionRepository: WarningTransactionRepository =
      createMock<WarningTransactionRepository>();
    const mockGetWarningTransactionById: jest.Mock = On(
      warningTransactionRepository,
    ).get(method((mock) => mock.getById));

    const warningTransactionEventEmitter: WarningTransactionEventEmitter =
      createMock<WarningTransactionEventEmitter>();
    const mockEventEmitter: jest.Mock = On(warningTransactionEventEmitter).get(
      method((mock) => mock.closedWarningTransaction),
    );

    const warningTransactionGateway: WarningTransactionGateway =
      createMock<WarningTransactionGateway>();
    const mockUpdateWarningTransactionStatusToClosed: jest.Mock = On(
      warningTransactionGateway,
    ).get(method((mock) => mock.updateWarningTransactionStatusToClosed));

    const sut = new UseCase(
      logger,
      warningTransactionRepository,
      warningTransactionGateway,
      warningTransactionEventEmitter,
    );

    return {
      sut,
      mockGetWarningTransactionById,
      mockUpdateWarningTransactionStatusToClosed,
      mockEventEmitter,
    };
  };
  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningTransactionById,
        mockUpdateWarningTransactionStatusToClosed,
      } = makeSut();

      const testScript = () => sut.execute(null);
      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetWarningTransactionById).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningTransactionStatusToClosed).toHaveBeenCalledTimes(
        0,
      );
      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw WarningTransactionNotFoundException if warning transaction is not found', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningTransactionById,
        mockUpdateWarningTransactionStatusToClosed,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
        );

      mockGetWarningTransactionById.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(warningTransaction.id);

      await expect(testScript).rejects.toThrow(
        WarningTransactionNotFoundException,
      );

      expect(mockGetWarningTransactionById).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningTransactionStatusToClosed).toHaveBeenCalledTimes(
        0,
      );
      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return warning transaction if status is not closed', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningTransactionById,
        mockUpdateWarningTransactionStatusToClosed,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            status: WarningTransactionStatus.PENDING,
          },
        );

      mockGetWarningTransactionById.mockResolvedValueOnce(warningTransaction);

      const testScript = await sut.execute(warningTransaction.id);

      expect(testScript.status).toBe(WarningTransactionStatus.PENDING);
      expect(mockGetWarningTransactionById).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningTransactionStatusToClosed).toHaveBeenCalledTimes(
        0,
      );
      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should close warning transaction by jira gateway successfully', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningTransactionById,
        mockUpdateWarningTransactionStatusToClosed,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            status: WarningTransactionStatus.CLOSED,
          },
        );

      mockGetWarningTransactionById.mockResolvedValueOnce(warningTransaction);

      const testScript = await sut.execute(warningTransaction.id);

      expect(testScript.status).toBe(WarningTransactionStatus.CLOSED);
      expect(mockGetWarningTransactionById).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningTransactionStatusToClosed).toHaveBeenCalledTimes(
        1,
      );
      expect(mockEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
