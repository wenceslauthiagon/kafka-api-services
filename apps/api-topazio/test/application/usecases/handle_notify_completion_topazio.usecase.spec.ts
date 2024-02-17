import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  NotifyCompletionEntity,
  NotifyCompletionRepository,
  StatusType,
} from '@zro/api-topazio/domain';
import {
  HandleNotifyCompletionTopazioEventUseCase as UseCase,
  NotifyInvalidStatusException,
  NotifyPixDevolutionNotFoundException,
  NotifyPixPaymentNotFoundException,
  PixDevolutionEventEmitter,
  PixPaymentEventEmitter,
} from '@zro/api-topazio/application';
import { PixPaymentServiceKafka } from '@zro/api-topazio/infrastructure';
import { NotifyCompletionFactory } from '@zro/test/api-topazio/config';

describe('HandleNotifyCompletionTopazioEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { notifyCompletionRepository, mockCreateNotifyCompletionRepository } =
      mockRepository();
    const {
      pixPaymentService,
      mockGetPixPaymentService,
      mockGetPixDevolutionService,
    } = mockService();
    const {
      pixPaymentEmitter,
      pixDevolutionEmitter,
      mockCompletedPaymentEventEmitter,
      mockCompletedDevolutionEventEmitter,
    } = mockEventEmitter();

    const sut = new UseCase(
      logger,
      notifyCompletionRepository,
      pixPaymentService,
      pixPaymentEmitter,
      pixDevolutionEmitter,
    );

    return {
      sut,
      mockCreateNotifyCompletionRepository,
      mockGetPixPaymentService,
      mockGetPixDevolutionService,
      mockCompletedPaymentEventEmitter,
      mockCompletedDevolutionEventEmitter,
    };
  };

  const mockRepository = () => {
    const notifyCompletionRepository: NotifyCompletionRepository =
      createMock<NotifyCompletionRepository>();
    const mockCreateNotifyCompletionRepository: jest.Mock = On(
      notifyCompletionRepository,
    ).get(method((mock) => mock.create));

    return {
      notifyCompletionRepository,
      mockCreateNotifyCompletionRepository,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentServiceKafka =
      createMock<PixPaymentServiceKafka>();
    const mockGetPixPaymentService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.getPixPaymentById),
    );
    const mockGetPixDevolutionService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.getPixDevolutionById),
    );

    return {
      pixPaymentService,
      mockGetPixPaymentService,
      mockGetPixDevolutionService,
    };
  };

  const mockEventEmitter = () => {
    const pixPaymentEmitter: PixPaymentEventEmitter =
      createMock<PixPaymentEventEmitter>();
    const mockCompletedPaymentEventEmitter: jest.Mock = On(
      pixPaymentEmitter,
    ).get(method((mock) => mock.completedPayment));

    const pixDevolutionEmitter: PixDevolutionEventEmitter =
      createMock<PixDevolutionEventEmitter>();
    const mockCompletedDevolutionEventEmitter: jest.Mock = On(
      pixDevolutionEmitter,
    ).get(method((mock) => mock.completedDevolution));

    return {
      pixPaymentEmitter,
      pixDevolutionEmitter,
      mockCompletedPaymentEventEmitter,
      mockCompletedDevolutionEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle notify completion when transaction id is null', async () => {
      const {
        sut,
        mockCreateNotifyCompletionRepository,
        mockGetPixPaymentService,
        mockGetPixDevolutionService,
        mockCompletedPaymentEventEmitter,
        mockCompletedDevolutionEventEmitter,
      } = makeSut();
      const notifyCompletion = new NotifyCompletionEntity({
        transactionId: null,
      });

      const testScript = () => sut.execute(notifyCompletion);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateNotifyCompletionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPixPaymentService).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCompletedPaymentEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCompletedDevolutionEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not handle notify completion when isDevolution is null', async () => {
      const {
        sut,
        mockCreateNotifyCompletionRepository,
        mockGetPixPaymentService,
        mockGetPixDevolutionService,
        mockCompletedPaymentEventEmitter,
        mockCompletedDevolutionEventEmitter,
      } = makeSut();
      const notifyCompletion = new NotifyCompletionEntity({
        transactionId: uuidV4(),
        isDevolution: null,
      });

      const testScript = () => sut.execute(notifyCompletion);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateNotifyCompletionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPixPaymentService).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCompletedPaymentEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCompletedDevolutionEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle notify completion when status is null', async () => {
      const {
        sut,
        mockCreateNotifyCompletionRepository,
        mockGetPixPaymentService,
        mockGetPixDevolutionService,
        mockCompletedPaymentEventEmitter,
        mockCompletedDevolutionEventEmitter,
      } = makeSut();
      const notifyCompletion = new NotifyCompletionEntity({
        transactionId: uuidV4(),
        status: null,
      });

      const testScript = () => sut.execute(notifyCompletion);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateNotifyCompletionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPixPaymentService).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCompletedPaymentEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCompletedDevolutionEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not handle notify completion when invalid status', async () => {
      const {
        sut,
        mockCreateNotifyCompletionRepository,
        mockGetPixPaymentService,
        mockGetPixDevolutionService,
        mockCompletedPaymentEventEmitter,
        mockCompletedDevolutionEventEmitter,
      } = makeSut();
      const notifyCredit = new NotifyCompletionEntity({
        transactionId: uuidV4(),
        status: StatusType.ERROR,
        isDevolution: false,
      });

      const testScript = () => sut.execute(notifyCredit);

      await expect(testScript).rejects.toThrow(NotifyInvalidStatusException);
      expect(mockCreateNotifyCompletionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPixPaymentService).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCompletedPaymentEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCompletedDevolutionEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not handle notify completion when payment is not found', async () => {
      const {
        sut,
        mockCreateNotifyCompletionRepository,
        mockGetPixPaymentService,
        mockGetPixDevolutionService,
        mockCompletedPaymentEventEmitter,
        mockCompletedDevolutionEventEmitter,
      } = makeSut();
      const data = await NotifyCompletionFactory.create<NotifyCompletionEntity>(
        NotifyCompletionEntity.name,
        { isDevolution: false },
      );
      mockGetPixPaymentService.mockResolvedValue(null);

      const testScript = () => sut.execute(data);

      await expect(testScript).rejects.toThrow(
        NotifyPixPaymentNotFoundException,
      );
      expect(mockCreateNotifyCompletionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPixPaymentService).toHaveBeenCalledTimes(1);
      expect(mockGetPixPaymentService).toHaveBeenCalledWith(data.transactionId);
      expect(mockGetPixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCompletedPaymentEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCompletedDevolutionEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not handle notify completion when devolution is not found', async () => {
      const {
        sut,
        mockCreateNotifyCompletionRepository,
        mockGetPixPaymentService,
        mockGetPixDevolutionService,
        mockCompletedPaymentEventEmitter,
        mockCompletedDevolutionEventEmitter,
      } = makeSut();

      const data = await NotifyCompletionFactory.create<NotifyCompletionEntity>(
        NotifyCompletionEntity.name,
        { isDevolution: true },
      );

      mockGetPixDevolutionService.mockResolvedValue(null);

      const testScript = () => sut.execute(data);

      await expect(testScript).rejects.toThrow(
        NotifyPixDevolutionNotFoundException,
      );
      expect(mockCreateNotifyCompletionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPixPaymentService).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionService).toHaveBeenCalledTimes(1);
      expect(mockGetPixDevolutionService).toHaveBeenCalledWith(
        data.transactionId,
      );
      expect(mockCompletedPaymentEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCompletedDevolutionEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should handle notify completion when devolution is false', async () => {
      const {
        sut,
        mockCreateNotifyCompletionRepository,
        mockGetPixPaymentService,
        mockGetPixDevolutionService,
        mockCompletedPaymentEventEmitter,
        mockCompletedDevolutionEventEmitter,
      } = makeSut();

      const data = await NotifyCompletionFactory.create<NotifyCompletionEntity>(
        NotifyCompletionEntity.name,
        { isDevolution: false },
      );

      mockGetPixPaymentService.mockImplementationOnce((id) => ({ id }));

      await sut.execute(data);

      expect(mockCreateNotifyCompletionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPixPaymentService).toHaveBeenCalledTimes(1);
      expect(mockGetPixPaymentService).toHaveBeenCalledWith(data.transactionId);
      expect(mockGetPixDevolutionService).toHaveBeenCalledTimes(0);
      expect(mockCompletedPaymentEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockCompletedPaymentEventEmitter).toHaveBeenCalledWith({
        id: data.transactionId,
        endToEndId: data.endToEndId,
      });
      expect(mockCompletedDevolutionEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should handle notify completion when devolution is true', async () => {
      const {
        sut,
        mockCreateNotifyCompletionRepository,
        mockGetPixPaymentService,
        mockGetPixDevolutionService,
        mockCompletedPaymentEventEmitter,
        mockCompletedDevolutionEventEmitter,
      } = makeSut();

      const data = await NotifyCompletionFactory.create<NotifyCompletionEntity>(
        NotifyCompletionEntity.name,
        { isDevolution: true },
      );

      mockGetPixDevolutionService.mockImplementationOnce((id) => ({ id }));

      await sut.execute(data);

      expect(mockCreateNotifyCompletionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPixPaymentService).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionService).toHaveBeenCalledTimes(1);
      expect(mockGetPixDevolutionService).toHaveBeenCalledWith(
        data.transactionId,
      );
      expect(mockCompletedPaymentEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockCompletedDevolutionEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockCompletedDevolutionEventEmitter).toHaveBeenCalledWith({
        id: data.transactionId,
        endToEndId: data.endToEndId,
      });
    });
  });
});
