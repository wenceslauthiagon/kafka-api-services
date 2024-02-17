import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationRepository,
  PixRefundDevolutionEntity,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixRefundEntity,
  PixRefundRepository,
  PixRefundState,
} from '@zro/pix-payments/domain';
import {
  HandleCompletePixRefundDevolutionEventUseCase as UseCase,
  PixRefundDevolutionNotFoundException,
  PixRefundGateway,
  OperationService,
  PixRefundEventEmitter,
  PixRefundDevolutionInvalidStateException,
  PixRefundDevolutionEventEmitter,
  PixRefundNotFoundException,
} from '@zro/pix-payments/application';
import {
  PixInfractionRefundOperationFactory,
  PixRefundDevolutionFactory,
  PixRefundFactory,
} from '@zro/test/pix-payments/config';

describe('HandleCompletePixRefundDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventRefundEmitter: PixRefundEventEmitter =
      createMock<PixRefundEventEmitter>();

    const mockCloseConfirmedPixRefund: jest.Mock = On(eventRefundEmitter).get(
      method((mock) => mock.closeConfirmedPixRefund),
    );

    const eventRefundDevolutionEmitter: PixRefundDevolutionEventEmitter =
      createMock<PixRefundDevolutionEventEmitter>();

    const mockConfirmedRefundDevolution: jest.Mock = On(
      eventRefundDevolutionEmitter,
    ).get(method((mock) => mock.confirmedRefundDevolution));

    return {
      eventRefundEmitter,
      mockCloseConfirmedPixRefund,
      eventRefundDevolutionEmitter,
      mockConfirmedRefundDevolution,
    };
  };

  const mockRepository = () => {
    const refundDevolutionRepository: PixRefundDevolutionRepository =
      createMock<PixRefundDevolutionRepository>();
    const mockGetByIdRefundDevolutionRepository: jest.Mock = On(
      refundDevolutionRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateRefundDevolutionRepository: jest.Mock = On(
      refundDevolutionRepository,
    ).get(method((mock) => mock.update));

    const refundRepository: PixRefundRepository =
      createMock<PixRefundRepository>();
    const mockUpdateRefundRepository: jest.Mock = On(refundRepository).get(
      method((mock) => mock.update),
    );
    const mockGetByRefundDevolutionRefundDevolutionRepository: jest.Mock = On(
      refundRepository,
    ).get(method((mock) => mock.getByRefundDevolution));

    const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
      createMock<PixInfractionRefundOperationRepository>();
    const mockGetAllPixInfractionRefundOperationByFilter: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.getAllByFilter));
    const mockUpdatePixInfractionRefundOperation: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.update));

    return {
      refundDevolutionRepository,
      mockGetByIdRefundDevolutionRepository,
      mockUpdateRefundDevolutionRepository,
      refundRepository,
      mockUpdateRefundRepository,
      mockGetByRefundDevolutionRefundDevolutionRepository,
      pixInfractionRefundOperationRepository,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
    };
  };

  const mockGateway = () => {
    const pixRefundGateway: PixRefundGateway = createMock<PixRefundGateway>();
    const mockCloseRefundRequestPixRefundGateway: jest.Mock = On(
      pixRefundGateway,
    ).get(method((mock) => mock.closeRefundRequest));

    return {
      pixRefundGateway,
      mockCloseRefundRequestPixRefundGateway,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockAcceptOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.acceptOperation),
    );

    return {
      operationService,
      mockAcceptOperationService,
    };
  };

  const makeSut = () => {
    const {
      refundDevolutionRepository,
      mockGetByIdRefundDevolutionRepository,
      mockUpdateRefundDevolutionRepository,
      refundRepository,
      mockUpdateRefundRepository,
      mockGetByRefundDevolutionRefundDevolutionRepository,
      pixInfractionRefundOperationRepository,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
    } = mockRepository();

    const { pixRefundGateway, mockCloseRefundRequestPixRefundGateway } =
      mockGateway();

    const {
      eventRefundEmitter,
      mockCloseConfirmedPixRefund,
      eventRefundDevolutionEmitter,
      mockConfirmedRefundDevolution,
    } = mockEmitter();

    const { operationService, mockAcceptOperationService } = mockService();

    const sut = new UseCase(
      logger,
      refundDevolutionRepository,
      refundRepository,
      pixInfractionRefundOperationRepository,
      operationService,
      pixRefundGateway,
      eventRefundEmitter,
      eventRefundDevolutionEmitter,
    );

    return {
      sut,
      mockGetByIdRefundDevolutionRepository,
      mockUpdateRefundDevolutionRepository,
      mockUpdateRefundRepository,
      mockGetByRefundDevolutionRefundDevolutionRepository,
      mockCloseConfirmedPixRefund,
      mockConfirmedRefundDevolution,
      mockCloseRefundRequestPixRefundGateway,
      mockAcceptOperationService,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockUpdateRefundDevolutionRepository,
        mockUpdateRefundRepository,
        mockGetByRefundDevolutionRefundDevolutionRepository,
        mockCloseConfirmedPixRefund,
        mockConfirmedRefundDevolution,
        mockCloseRefundRequestPixRefundGateway,
        mockAcceptOperationService,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();

      const testScript = sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetByRefundDevolutionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCloseConfirmedPixRefund).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCloseRefundRequestPixRefundGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if PixRefund not exists', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockUpdateRefundDevolutionRepository,
        mockUpdateRefundRepository,
        mockGetByRefundDevolutionRefundDevolutionRepository,
        mockCloseConfirmedPixRefund,
        mockConfirmedRefundDevolution,
        mockCloseRefundRequestPixRefundGateway,
        mockAcceptOperationService,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();
      const { id } =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          { state: PixRefundDevolutionState.WAITING },
        );
      mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(
        PixRefundDevolutionNotFoundException,
      );
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetByRefundDevolutionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCloseConfirmedPixRefund).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCloseRefundRequestPixRefundGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if state is invalid', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockUpdateRefundDevolutionRepository,
        mockUpdateRefundRepository,
        mockGetByRefundDevolutionRefundDevolutionRepository,
        mockCloseConfirmedPixRefund,
        mockConfirmedRefundDevolution,
        mockCloseRefundRequestPixRefundGateway,
        mockAcceptOperationService,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          { state: PixRefundDevolutionState.ERROR },
        );
      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);

      const testScript = () => sut.execute(refundDevolution.id);

      await expect(testScript).rejects.toThrow(
        PixRefundDevolutionInvalidStateException,
      );
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetByRefundDevolutionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCloseConfirmedPixRefund).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCloseRefundRequestPixRefundGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not update if pixRefund is not found', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockUpdateRefundDevolutionRepository,
        mockUpdateRefundRepository,
        mockGetByRefundDevolutionRefundDevolutionRepository,
        mockCloseConfirmedPixRefund,
        mockConfirmedRefundDevolution,
        mockCloseRefundRequestPixRefundGateway,
        mockAcceptOperationService,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          { state: PixRefundDevolutionState.WAITING },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);
      mockGetByRefundDevolutionRefundDevolutionRepository.mockResolvedValue(
        null,
      );

      const testScript = () => sut.execute(refundDevolution.id);

      await expect(testScript).rejects.toThrow(PixRefundNotFoundException);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetByRefundDevolutionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCloseConfirmedPixRefund).toHaveBeenCalledTimes(0);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(0);
      expect(mockCloseRefundRequestPixRefundGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should create refund devolution successfully', async () => {
      const {
        sut,
        mockGetByIdRefundDevolutionRepository,
        mockUpdateRefundDevolutionRepository,
        mockUpdateRefundRepository,
        mockGetByRefundDevolutionRefundDevolutionRepository,
        mockCloseConfirmedPixRefund,
        mockConfirmedRefundDevolution,
        mockCloseRefundRequestPixRefundGateway,
        mockAcceptOperationService,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();
      const refundDevolution =
        await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
          PixRefundDevolutionEntity.name,
          { state: PixRefundDevolutionState.WAITING },
        );

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        { refundDevolution },
      );

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
          {
            pixRefund: refund,
          },
        );

      mockGetByIdRefundDevolutionRepository.mockResolvedValue(refundDevolution);
      mockGetByRefundDevolutionRefundDevolutionRepository.mockResolvedValue(
        refund,
      );
      mockGetAllPixInfractionRefundOperationByFilter.mockResolvedValue([
        pixInfractionRefundOperation,
      ]);

      const result = await sut.execute(refundDevolution.id);

      expect(result).toBeDefined();
      expect(result.state).toEqual(PixRefundDevolutionState.CONFIRMED);
      expect(refund.state).toEqual(PixRefundState.CLOSED_CONFIRMED);
      expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetByRefundDevolutionRefundDevolutionRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCloseConfirmedPixRefund).toHaveBeenCalledTimes(1);
      expect(mockConfirmedRefundDevolution).toHaveBeenCalledTimes(1);
      expect(mockCloseRefundRequestPixRefundGateway).toHaveBeenCalledTimes(1);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(1);
    });
  });
});
