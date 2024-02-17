import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  WebhookEntity,
  WebhookEventRepository,
  WebhookRepository,
} from '@zro/webhooks/domain';
import {
  PixDevolutionEntity,
  PixDevolutionState,
  PixDepositEntity,
} from '@zro/pix-payments/domain';
import {
  PixPaymentService,
  WebhookEventEmitter,
  HandleWebhookDevolutionCompletedEventUseCase as UseCase,
} from '@zro/webhooks/application';
import {
  PixDevolutionNotFoundException,
  PixDevolutionInvalidStateException,
} from '@zro/pix-payments/application';
import {
  PixDevolutionFactory,
  PixDepositFactory,
} from '@zro/test/pix-payments/config';

describe('HandleDevolutionCompletedEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockEmitter = () => {
    const eventEmitter: WebhookEventEmitter = createMock<WebhookEventEmitter>();

    const mockCreatedEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.created),
    );

    return {
      eventEmitter,
      mockCreatedEvent,
    };
  };

  const mockRepository = () => {
    const webhookEventRepository: WebhookEventRepository =
      createMock<WebhookEventRepository>();
    const mockCreateRepository: jest.Mock = On(webhookEventRepository).get(
      method((mock) => mock.create),
    );

    const webhookRepository: WebhookRepository =
      createMock<WebhookRepository>();
    const mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository: jest.Mock =
      On(webhookRepository).get(
        method(
          (mock) => mock.getActivateAndDevolutionCompletedByAccountAndAgency,
        ),
      );

    return {
      webhookEventRepository,
      webhookRepository,
      mockCreateRepository,
      mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
    };
  };

  const mockService = () => {
    const pixDevolutionService: PixPaymentService =
      createMock<PixPaymentService>();

    const mockGetDevolutionByIdService: jest.Mock = On(
      pixDevolutionService,
    ).get(method((mock) => mock.getDevolutionById));

    const mockGetDepositByIdService: jest.Mock = On(pixDevolutionService).get(
      method((mock) => mock.getPixDepositById),
    );

    return {
      pixDevolutionService,
      mockGetDevolutionByIdService,
      mockGetDepositByIdService,
    };
  };

  const makeSut = () => {
    const {
      webhookEventRepository,
      mockCreateRepository,
      webhookRepository,
      mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
    } = mockRepository();

    const { eventEmitter, mockCreatedEvent } = mockEmitter();

    const {
      pixDevolutionService,
      mockGetDevolutionByIdService,
      mockGetDepositByIdService,
    } = mockService();

    const sut = new UseCase(
      logger,
      webhookRepository,
      webhookEventRepository,
      pixDevolutionService,
      eventEmitter,
    );

    return {
      sut,
      mockCreateRepository,
      mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
      mockCreatedEvent,
      mockGetDevolutionByIdService,
      mockGetDepositByIdService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if missing params', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw if devolution not has id', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
      } = makeSut();

      const testScript = () => sut.execute(new PixDevolutionEntity({}));

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixDevolutionnotFoundException if devolution not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );

      mockGetDevolutionByIdService.mockReturnValue(null);

      const testScript = () =>
        sut.execute(new PixDevolutionEntity({ id: devolution.id }));

      await expect(testScript).rejects.toThrow(PixDevolutionNotFoundException);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledWith(devolution.id);
    });

    it('TC0004 - Should throw PixDevolutionInvalidStateException if devolution state not is confirmed', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );

      mockGetDevolutionByIdService.mockReturnValue(
        new PixDevolutionEntity({ state: PixDevolutionState.PENDING }),
      );

      const testScript = () => sut.execute(devolution);

      await expect(testScript).rejects.toThrow(
        PixDevolutionInvalidStateException,
      );
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledWith(devolution.id);
    });

    it('TC0005 - Should do nothing if Webhook is not found', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
        mockGetDepositByIdService,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { clientAccountNumber: '1', clientBranch: '2' },
      );

      mockGetDepositByIdService.mockResolvedValue(deposit);

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );

      mockGetDevolutionByIdService.mockReturnValue(devolution);

      mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository.mockReturnValue(
        null,
      );

      const result = await sut.execute(devolution);

      expect(result).toBeUndefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledWith(devolution.id);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create webhook event', async () => {
      const {
        sut,
        mockCreateRepository,
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
        mockCreatedEvent,
        mockGetDevolutionByIdService,
        mockGetDepositByIdService,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { clientAccountNumber: '1', clientBranch: '2' },
      );

      mockGetDepositByIdService.mockResolvedValue(deposit);

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.CONFIRMED },
      );

      const webhook = new WebhookEntity({
        targetUrl: 'target-url',
        apiKey: 'api-key',
      });

      mockGetDevolutionByIdService.mockReturnValue(devolution);

      mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository.mockReturnValue(
        webhook,
      );

      const result = await sut.execute(devolution);

      expect(result).toBeDefined();
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetActivateAndDevolutionCompletedByAccountAndAgencyRepository,
      ).toHaveBeenCalledWith(deposit.clientAccountNumber, deposit.clientBranch);
      expect(mockCreatedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionByIdService).toHaveBeenCalledWith(devolution.id);
    });
  });
});
