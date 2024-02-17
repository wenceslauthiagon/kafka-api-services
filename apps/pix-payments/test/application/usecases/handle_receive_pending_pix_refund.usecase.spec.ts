import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixRefundEntity,
  PixRefundRepository,
  PixRefundState,
  PixRefundTransactionType,
} from '@zro/pix-payments/domain';
import {
  HandleReceivePendingPixRefundUseCase as UseCase,
  PixRefundEventEmitter,
  IssueRefundGateway,
  PixRefundNotFoundException,
} from '@zro/pix-payments/application';
import { PixRefundFactory } from '@zro/test/pix-payments/config';

describe('ReceivePixRefundEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixRefundEventEmitter =
      createMock<PixRefundEventEmitter>();

    const mockReceiveConfirmedPixRefundEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.receiveConfirmedPixRefund),
    );

    return {
      eventEmitter,
      mockReceiveConfirmedPixRefundEvent,
    };
  };

  const mockRepository = () => {
    const refundRepository: PixRefundRepository =
      createMock<PixRefundRepository>();
    const mockUpdatePixRefundRepository: jest.Mock = On(refundRepository).get(
      method((mock) => mock.update),
    );
    const mockGetPixRefundByIdRepository: jest.Mock = On(refundRepository).get(
      method((mock) => mock.getById),
    );

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetPixDepositByIdRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getById));

    const devolutionReceivedRepository: PixDevolutionReceivedRepository =
      createMock<PixDevolutionReceivedRepository>();
    const mockGetPixDevolutionReceivedByIdRepository: jest.Mock = On(
      devolutionReceivedRepository,
    ).get(method((mock) => mock.getById));

    return {
      depositRepository,
      refundRepository,
      devolutionReceivedRepository,
      mockUpdatePixRefundRepository,
      mockGetPixRefundByIdRepository,
      mockGetPixDepositByIdRepository,
      mockGetPixDevolutionReceivedByIdRepository,
    };
  };

  const mockGateway = () => {
    const issuePixRefundGateway: IssueRefundGateway =
      createMock<IssueRefundGateway>();
    const mockCreatePixRefundGateway: jest.Mock = On(issuePixRefundGateway).get(
      method((mock) => mock.createRefund),
    );

    return {
      issuePixRefundGateway,
      mockCreatePixRefundGateway,
    };
  };

  const makeSut = () => {
    const {
      refundRepository,
      depositRepository,
      devolutionReceivedRepository,
      mockGetPixRefundByIdRepository,
      mockUpdatePixRefundRepository,
      mockGetPixDepositByIdRepository,
      mockGetPixDevolutionReceivedByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockReceiveConfirmedPixRefundEvent } = mockEmitter();

    const { issuePixRefundGateway, mockCreatePixRefundGateway } = mockGateway();

    const sut = new UseCase(
      logger,
      refundRepository,
      depositRepository,
      devolutionReceivedRepository,
      issuePixRefundGateway,
      eventEmitter,
    );

    return {
      sut,
      mockGetPixRefundByIdRepository,
      mockUpdatePixRefundRepository,
      mockGetPixDepositByIdRepository,
      mockGetPixDevolutionReceivedByIdRepository,
      mockReceiveConfirmedPixRefundEvent,
      mockCreatePixRefundGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - should update pixRefund successfully', async () => {
      const {
        sut,
        mockGetPixRefundByIdRepository,
        mockUpdatePixRefundRepository,
        mockGetPixDepositByIdRepository,
        mockGetPixDevolutionReceivedByIdRepository,
        mockCreatePixRefundGateway,
        mockReceiveConfirmedPixRefundEvent,
      } = makeSut();

      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          transactionType: PixRefundTransactionType.DEPOSIT,
        },
      );

      mockGetPixRefundByIdRepository.mockResolvedValue(pixRefund);
      mockUpdatePixRefundRepository.mockImplementation((body) => body);

      const result = await sut.execute(pixRefund.id);

      expect(result).toBeDefined();
      expect(result.issueId).toBeDefined();
      expect(result.state).toBe(PixRefundState.RECEIVE_CONFIRMED);

      expect(mockGetPixRefundByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPixDepositByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPixDevolutionReceivedByIdRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreatePixRefundGateway).toHaveBeenCalledTimes(1);
      expect(mockReceiveConfirmedPixRefundEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException if there are missing data', async () => {
      const {
        sut,
        mockGetPixRefundByIdRepository,
        mockUpdatePixRefundRepository,
        mockGetPixDepositByIdRepository,
        mockGetPixDevolutionReceivedByIdRepository,
        mockCreatePixRefundGateway,
        mockReceiveConfirmedPixRefundEvent,
      } = makeSut();

      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetPixRefundByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPixDepositByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionReceivedByIdRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreatePixRefundGateway).toHaveBeenCalledTimes(0);
      expect(mockReceiveConfirmedPixRefundEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixRefundNotFoundException if pixRefund is not found', async () => {
      const {
        sut,
        mockGetPixRefundByIdRepository,
        mockUpdatePixRefundRepository,
        mockGetPixDepositByIdRepository,
        mockGetPixDevolutionReceivedByIdRepository,
        mockCreatePixRefundGateway,
        mockReceiveConfirmedPixRefundEvent,
      } = makeSut();

      mockGetPixRefundByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(uuidV4());

      await expect(testScript).rejects.toThrow(PixRefundNotFoundException);

      expect(mockGetPixRefundByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPixDepositByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPixDevolutionReceivedByIdRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreatePixRefundGateway).toHaveBeenCalledTimes(0);
      expect(mockReceiveConfirmedPixRefundEvent).toHaveBeenCalledTimes(0);
    });
  });
});
