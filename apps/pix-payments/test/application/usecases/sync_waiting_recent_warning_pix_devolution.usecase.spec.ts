import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { v4 as uuidV4 } from 'uuid';
import { defaultLogger as logger, getMoment } from '@zro/common';
import {
  WarningPixDevolutionState,
  WarningPixDevolutionRepository,
  WarningPixDevolutionEntity,
} from '@zro/pix-payments/domain';
import {
  SyncWaitingRecentWarningPixDevolutionUseCase as UseCase,
  WarningPixDevolutionEventEmitter,
  PixPaymentGateway,
  TranslateService,
} from '@zro/pix-payments/application';
import { WarningPixDevolutionFactory } from '@zro/test/pix-payments/config';
import * as GetWarningPixDevolutionByIdPspGatewayMock from '@zro/test/pix-payments/config/mocks/get_payment_by_id.mock';

describe('SyncWaitingRecentWarningPixDevolutionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: WarningPixDevolutionEventEmitter =
      createMock<WarningPixDevolutionEventEmitter>();

    const mockCompletedWarningPixDevolutionEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.completedWarningPixDevolution));

    const mockRevertedWarningPixDevolutionEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.revertedWarningPixDevolution));

    return {
      eventEmitter,
      mockCompletedWarningPixDevolutionEvent,
      mockRevertedWarningPixDevolutionEvent,
    };
  };

  const mockRepository = () => {
    const repository: WarningPixDevolutionRepository =
      createMock<WarningPixDevolutionRepository>();
    const mockGetAllRepository: jest.Mock = On(repository).get(
      method((mock) => mock.getAllByStateAndThresholdDate),
    );

    return {
      repository,
      mockGetAllWarningPixDevolutionRepository: mockGetAllRepository,
    };
  };

  const mockGateway = () => {
    const warningPixDevolutionGateway: PixPaymentGateway =
      createMock<PixPaymentGateway>();
    const mockGetWarningPixDevolutionByIdGateway: jest.Mock = On(
      warningPixDevolutionGateway,
    ).get(method((mock) => mock.getPaymentById));

    return {
      warningPixDevolutionGateway,
      mockGetWarningPixDevolutionByIdGateway,
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
      mockCompletedWarningPixDevolutionEvent,
      mockRevertedWarningPixDevolutionEvent,
    } = mockEmitter();

    const { repository, mockGetAllWarningPixDevolutionRepository } =
      mockRepository();

    const {
      warningPixDevolutionGateway,
      mockGetWarningPixDevolutionByIdGateway,
    } = mockGateway();

    const updatedAtThresholdInSeconds = 40;

    const sut = new UseCase(
      logger,
      translateService,
      repository,
      eventEmitter,
      warningPixDevolutionGateway,
      updatedAtThresholdInSeconds,
    );

    return {
      sut,
      mockCompletedWarningPixDevolutionEvent,
      mockRevertedWarningPixDevolutionEvent,
      mockGetAllWarningPixDevolutionRepository,
      mockGetWarningPixDevolutionByIdGateway,
      mockTranslateError,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should emit completed event successfully when WarningPixDevolution exists and it is settled.', async () => {
      const {
        sut,
        mockCompletedWarningPixDevolutionEvent,
        mockRevertedWarningPixDevolutionEvent,
        mockGetAllWarningPixDevolutionRepository,
        mockGetWarningPixDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: WarningPixDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllWarningPixDevolutionRepository.mockResolvedValue([
        warningPixDevolution,
      ]);

      mockGetWarningPixDevolutionByIdGateway.mockResolvedValue(
        GetWarningPixDevolutionByIdPspGatewayMock.successPaymentSettled(),
      );

      await sut.execute();

      expect(mockCompletedWarningPixDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockRevertedWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should emit reverted event successfully when WarningPixDevolution exists and it is not settled.', async () => {
      const {
        sut,
        mockCompletedWarningPixDevolutionEvent,
        mockRevertedWarningPixDevolutionEvent,
        mockGetAllWarningPixDevolutionRepository,
        mockGetWarningPixDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: WarningPixDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllWarningPixDevolutionRepository.mockResolvedValue([
        warningPixDevolution,
      ]);

      mockGetWarningPixDevolutionByIdGateway.mockResolvedValue(
        GetWarningPixDevolutionByIdPspGatewayMock.successPaymentNotSettled(),
      );
      const failed = {
        errorCode: 'AB03',
        errorMessage:
          'Liquidação da transação interrompida devido a timeout no SPI.',
      };
      mockTranslateError.mockResolvedValue(failed);

      await sut.execute();

      expect(mockCompletedWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedWarningPixDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockTranslateError).toHaveBeenCalledTimes(1);
      expect(mockRevertedWarningPixDevolutionEvent).toHaveBeenCalledWith(
        expect.objectContaining({ failed }),
      );
    });

    it('TC0003 - Should not emit any event when PSP does not respond.', async () => {
      const {
        sut,
        mockCompletedWarningPixDevolutionEvent,
        mockRevertedWarningPixDevolutionEvent,
        mockGetAllWarningPixDevolutionRepository,
        mockGetWarningPixDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: WarningPixDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllWarningPixDevolutionRepository.mockResolvedValue([
        warningPixDevolution,
      ]);

      mockGetWarningPixDevolutionByIdGateway.mockResolvedValue(undefined);

      await sut.execute();

      expect(mockCompletedWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not emit any event when receives an error.', async () => {
      const {
        sut,
        mockCompletedWarningPixDevolutionEvent,
        mockRevertedWarningPixDevolutionEvent,
        mockGetAllWarningPixDevolutionRepository,
        mockGetWarningPixDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: WarningPixDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllWarningPixDevolutionRepository.mockResolvedValue([
        warningPixDevolution,
      ]);

      mockGetWarningPixDevolutionByIdGateway.mockResolvedValue(
        GetWarningPixDevolutionByIdPspGatewayMock.offline(),
      );

      await sut.execute();

      expect(mockCompletedWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });
  });
});
