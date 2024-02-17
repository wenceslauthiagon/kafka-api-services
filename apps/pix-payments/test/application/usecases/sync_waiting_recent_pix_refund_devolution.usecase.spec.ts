import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { v4 as uuidV4 } from 'uuid';
import { defaultLogger as logger, getMoment } from '@zro/common';
import {
  PixRefundDevolutionState,
  PixRefundDevolutionRepository,
  PixRefundDevolutionEntity,
} from '@zro/pix-payments/domain';
import {
  SyncWaitingRecentPixRefundDevolutionUseCase as UseCase,
  PixRefundDevolutionEventEmitter,
  PixPaymentGateway,
  TranslateService,
} from '@zro/pix-payments/application';
import { PixRefundDevolutionFactory } from '@zro/test/pix-payments/config';
import * as GetPixRefundDevolutionByIdPspGatewayMock from '@zro/test/pix-payments/config/mocks/get_payment_by_id.mock';

describe('SyncWaitingRecentPixRefundDevolutionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixRefundDevolutionEventEmitter =
      createMock<PixRefundDevolutionEventEmitter>();

    const mockCompletedPixRefundDevolutionEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.completedRefundDevolution));

    const mockRevertedPixRefundDevolutionEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.revertedRefundDevolution));

    return {
      eventEmitter,
      mockCompletedPixRefundDevolutionEvent,
      mockRevertedPixRefundDevolutionEvent,
    };
  };

  const mockRepository = () => {
    const repository: PixRefundDevolutionRepository =
      createMock<PixRefundDevolutionRepository>();
    const mockGetAllRepository: jest.Mock = On(repository).get(
      method((mock) => mock.getAllByStateAndThresholdDate),
    );

    return {
      repository,
      mockGetAllPixRefundDevolutionRepository: mockGetAllRepository,
    };
  };

  const mockGateway = () => {
    const pixRefundDevolutionGateway: PixPaymentGateway =
      createMock<PixPaymentGateway>();
    const mockGetPixRefundDevolutionByIdGateway: jest.Mock = On(
      pixRefundDevolutionGateway,
    ).get(method((mock) => mock.getPaymentById));

    return {
      pixRefundDevolutionGateway,
      mockGetPixRefundDevolutionByIdGateway,
    };
  };

  const mockService = () => {
    const translateService: TranslateService = createMock<TranslateService>();
    const mockTranslateError: jest.Mock = On(translateService).get(
      method((mock) => mock.translatePixPaymentFailed),
    );

    return {
      translateService,
      mockTranslateError,
    };
  };

  const makeSut = () => {
    const { translateService, mockTranslateError } = mockService();
    const {
      eventEmitter,
      mockCompletedPixRefundDevolutionEvent,
      mockRevertedPixRefundDevolutionEvent,
    } = mockEmitter();

    const { repository, mockGetAllPixRefundDevolutionRepository } =
      mockRepository();

    const {
      pixRefundDevolutionGateway,
      mockGetPixRefundDevolutionByIdGateway,
    } = mockGateway();

    const updatedAtThresholdInSeconds = 40;

    const sut = new UseCase(
      logger,
      translateService,
      repository,
      eventEmitter,
      pixRefundDevolutionGateway,
      updatedAtThresholdInSeconds,
    );

    return {
      sut,
      mockCompletedPixRefundDevolutionEvent,
      mockRevertedPixRefundDevolutionEvent,
      mockGetAllPixRefundDevolutionRepository,
      mockGetPixRefundDevolutionByIdGateway,
      mockTranslateError,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should emit completed event successfully when PixRefundDevolution exists and it is settled.', async () => {
      const {
        sut,
        mockCompletedPixRefundDevolutionEvent,
        mockRevertedPixRefundDevolutionEvent,
        mockGetAllPixRefundDevolutionRepository,
        mockGetPixRefundDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const pixRefundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: PixRefundDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllPixRefundDevolutionRepository.mockResolvedValue([
        pixRefundDevolution,
      ]);

      mockGetPixRefundDevolutionByIdGateway.mockResolvedValue(
        GetPixRefundDevolutionByIdPspGatewayMock.successPaymentSettled(),
      );

      await sut.execute();

      expect(mockCompletedPixRefundDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockRevertedPixRefundDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should emit reverted event successfully when PixRefundDevolution exists and it is not settled.', async () => {
      const {
        sut,
        mockCompletedPixRefundDevolutionEvent,
        mockRevertedPixRefundDevolutionEvent,
        mockGetAllPixRefundDevolutionRepository,
        mockGetPixRefundDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const pixRefundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: PixRefundDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllPixRefundDevolutionRepository.mockResolvedValue([
        pixRefundDevolution,
      ]);

      mockGetPixRefundDevolutionByIdGateway.mockResolvedValue(
        GetPixRefundDevolutionByIdPspGatewayMock.successPaymentNotSettled(),
      );
      const failed = {
        errorCode: 'AB03',
        errorMessage:
          'Liquidação da transação interrompida devido a timeout no SPI.',
      };
      mockTranslateError.mockResolvedValue(failed);

      await sut.execute();

      expect(mockCompletedPixRefundDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedPixRefundDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockTranslateError).toHaveBeenCalledTimes(1);
      expect(mockRevertedPixRefundDevolutionEvent).toHaveBeenCalledWith(
        expect.objectContaining({ failed }),
      );
    });

    it('TC0003 - Should not emit any event when PSP does not respond.', async () => {
      const {
        sut,
        mockCompletedPixRefundDevolutionEvent,
        mockRevertedPixRefundDevolutionEvent,
        mockGetAllPixRefundDevolutionRepository,
        mockGetPixRefundDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const pixRefundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: PixRefundDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllPixRefundDevolutionRepository.mockResolvedValue([
        pixRefundDevolution,
      ]);

      mockGetPixRefundDevolutionByIdGateway.mockResolvedValue(undefined);

      await sut.execute();

      expect(mockCompletedPixRefundDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedPixRefundDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not emit any event when receives an error.', async () => {
      const {
        sut,
        mockCompletedPixRefundDevolutionEvent,
        mockRevertedPixRefundDevolutionEvent,
        mockGetAllPixRefundDevolutionRepository,
        mockGetPixRefundDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const pixRefundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: PixRefundDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllPixRefundDevolutionRepository.mockResolvedValue([
        pixRefundDevolution,
      ]);

      mockGetPixRefundDevolutionByIdGateway.mockResolvedValue(
        GetPixRefundDevolutionByIdPspGatewayMock.offline(),
      );

      await sut.execute();

      expect(mockCompletedPixRefundDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedPixRefundDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });
  });
});
