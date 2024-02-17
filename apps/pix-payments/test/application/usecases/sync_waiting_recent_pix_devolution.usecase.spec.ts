import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { v4 as uuidV4 } from 'uuid';
import { defaultLogger as logger, getMoment } from '@zro/common';
import {
  PixDevolutionState,
  PixDevolutionRepository,
  PixDevolutionEntity,
} from '@zro/pix-payments/domain';
import {
  SyncWaitingRecentPixDevolutionUseCase as UseCase,
  PixDevolutionEventEmitter,
  PixPaymentGateway,
  TranslateService,
} from '@zro/pix-payments/application';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';
import * as GetPixDevolutionByIdPspGatewayMock from '@zro/test/pix-payments/config/mocks/get_payment_by_id.mock';

describe('SyncWaitingRecentPixDevolutionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixDevolutionEventEmitter =
      createMock<PixDevolutionEventEmitter>();

    const mockCompletedPixDevolutionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.completedDevolution),
    );

    const mockRevertedPixDevolutionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.revertedDevolution),
    );

    return {
      eventEmitter,
      mockCompletedPixDevolutionEvent,
      mockRevertedPixDevolutionEvent,
    };
  };

  const mockRepository = () => {
    const repository: PixDevolutionRepository =
      createMock<PixDevolutionRepository>();
    const mockGetAllRepository: jest.Mock = On(repository).get(
      method((mock) => mock.getAllByStateAndThresholdDate),
    );

    return {
      repository,
      mockGetAllPixDevolutionRepository: mockGetAllRepository,
    };
  };

  const mockGateway = () => {
    const pixDevolutionGateway: PixPaymentGateway =
      createMock<PixPaymentGateway>();
    const mockGetPixDevolutionByIdGateway: jest.Mock = On(
      pixDevolutionGateway,
    ).get(method((mock) => mock.getPaymentById));

    return {
      pixDevolutionGateway,
      mockGetPixDevolutionByIdGateway,
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
      mockCompletedPixDevolutionEvent,
      mockRevertedPixDevolutionEvent,
    } = mockEmitter();

    const { repository, mockGetAllPixDevolutionRepository } = mockRepository();

    const { pixDevolutionGateway, mockGetPixDevolutionByIdGateway } =
      mockGateway();

    const updatedAtThresholdInSeconds = 40;

    const sut = new UseCase(
      logger,
      translateService,
      repository,
      eventEmitter,
      pixDevolutionGateway,
      updatedAtThresholdInSeconds,
    );

    return {
      sut,
      mockCompletedPixDevolutionEvent,
      mockRevertedPixDevolutionEvent,
      mockGetAllPixDevolutionRepository,
      mockGetPixDevolutionByIdGateway,
      mockTranslateError,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should emit completed event successfully when PixRefundDevolution exists and it is settled.', async () => {
      const {
        sut,
        mockCompletedPixDevolutionEvent,
        mockRevertedPixDevolutionEvent,
        mockGetAllPixDevolutionRepository,
        mockGetPixDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: PixDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllPixDevolutionRepository.mockResolvedValue([pixDevolution]);

      mockGetPixDevolutionByIdGateway.mockResolvedValue(
        GetPixDevolutionByIdPspGatewayMock.successPaymentSettled(),
      );

      await sut.execute();
      expect(mockCompletedPixDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockRevertedPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should emit reverted event successfully when PixRefundDevolution exists and it is not settled.', async () => {
      const {
        sut,
        mockCompletedPixDevolutionEvent,
        mockRevertedPixDevolutionEvent,
        mockGetAllPixDevolutionRepository,
        mockGetPixDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: PixDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllPixDevolutionRepository.mockResolvedValue([pixDevolution]);

      mockGetPixDevolutionByIdGateway.mockResolvedValue(
        GetPixDevolutionByIdPspGatewayMock.successPaymentNotSettled(),
      );
      const failed = {
        errorCode: 'AB03',
        errorMessage:
          'Liquidação da transação interrompida devido a timeout no SPI.',
      };
      mockTranslateError.mockResolvedValue(failed);

      await sut.execute();
      expect(mockCompletedPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedPixDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockTranslateError).toHaveBeenCalledTimes(1);
      expect(mockRevertedPixDevolutionEvent).toHaveBeenCalledWith(
        expect.objectContaining({ failed }),
      );
    });

    it('TC0003 - Should not emit any event when PSP does not respond.', async () => {
      const {
        sut,
        mockCompletedPixDevolutionEvent,
        mockRevertedPixDevolutionEvent,
        mockGetAllPixDevolutionRepository,
        mockGetPixDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: PixDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllPixDevolutionRepository.mockResolvedValue([pixDevolution]);

      mockGetPixDevolutionByIdGateway.mockResolvedValue(undefined);

      await sut.execute();
      expect(mockCompletedPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not emit any event when receives an error.', async () => {
      const {
        sut,
        mockCompletedPixDevolutionEvent,
        mockRevertedPixDevolutionEvent,
        mockGetAllPixDevolutionRepository,
        mockGetPixDevolutionByIdGateway,
        mockTranslateError,
      } = makeSut();

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          {
            externalId: uuidV4(),
            state: PixDevolutionState.WAITING,
            updatedAt: getMoment().toDate(),
          },
        );

      mockGetAllPixDevolutionRepository.mockResolvedValue([pixDevolution]);

      mockGetPixDevolutionByIdGateway.mockResolvedValue(
        GetPixDevolutionByIdPspGatewayMock.offline(),
      );

      await sut.execute();
      expect(mockCompletedPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertedPixDevolutionEvent).toHaveBeenCalledTimes(0);
      expect(mockTranslateError).toHaveBeenCalledTimes(0);
    });
  });
});
