import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  CryptoRemittanceEntity,
  CryptoRemittanceRepository,
  CryptoRemittanceStatus,
  RemittanceOrderRepository,
  SettlementDateCode,
  SystemEntity,
  SystemRepository,
} from '@zro/otc/domain';
import {
  CryptoRemittanceInvalidStatusException,
  CryptoRemittanceNotFoundException,
  HandleFilledCryptoRemittanceEventUseCase as UseCase,
  RemittanceOrderEventEmitter,
  SystemNotFoundException,
} from '@zro/otc/application';
import { CryptoRemittanceFactory, SystemFactory } from '@zro/test/otc/config';

describe('HandleFilledCryptoRemittanceEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const remittanceOrderEmitter: RemittanceOrderEventEmitter =
      createMock<RemittanceOrderEventEmitter>();
    const mockEmitCreatedRemittanceOrder: jest.Mock = On(
      remittanceOrderEmitter,
    ).get(method((mock) => mock.createdRemittanceOrder));

    return {
      remittanceOrderEmitter,
      mockEmitCreatedRemittanceOrder,
    };
  };

  const mockRepository = () => {
    const cryptoRemittanceRepository: CryptoRemittanceRepository =
      createMock<CryptoRemittanceRepository>();
    const mockGetByIdCryptoRemittanceRepository: jest.Mock = On(
      cryptoRemittanceRepository,
    ).get(method((mock) => mock.getById));

    const remittanceOrderRepository: RemittanceOrderRepository =
      createMock<RemittanceOrderRepository>();
    const mockCreateRemittanceOrderRepository: jest.Mock = On(
      remittanceOrderRepository,
    ).get(method((mock) => mock.create));

    const systemRepository: SystemRepository = createMock<SystemRepository>();
    const mockGetByNameSystemRepository: jest.Mock = On(systemRepository).get(
      method((mock) => mock.getByName),
    );

    return {
      cryptoRemittanceRepository,
      mockGetByIdCryptoRemittanceRepository,
      remittanceOrderRepository,
      mockCreateRemittanceOrderRepository,
      systemRepository,
      mockGetByNameSystemRepository,
    };
  };

  const makeSut = () => {
    const defaultSendDateCode = SettlementDateCode.D0;
    const defaultReceiveDateCode = SettlementDateCode.D0;
    const { remittanceOrderEmitter, mockEmitCreatedRemittanceOrder } =
      mockEmitter();

    const {
      cryptoRemittanceRepository,
      mockGetByIdCryptoRemittanceRepository,
      remittanceOrderRepository,
      mockCreateRemittanceOrderRepository,
      systemRepository,
      mockGetByNameSystemRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      cryptoRemittanceRepository,
      remittanceOrderRepository,
      systemRepository,
      remittanceOrderEmitter,
      defaultSendDateCode,
      defaultReceiveDateCode,
    );

    return {
      sut,
      mockEmitCreatedRemittanceOrder,
      mockGetByIdCryptoRemittanceRepository,
      mockCreateRemittanceOrderRepository,
      mockGetByNameSystemRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockEmitCreatedRemittanceOrder,
        mockGetByIdCryptoRemittanceRepository,
        mockCreateRemittanceOrderRepository,
        mockGetByNameSystemRepository,
      } = makeSut();

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
        );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(cryptoRemittance.id, null),
        () => sut.execute(null, system),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
        expect(mockEmitCreatedRemittanceOrder).toHaveBeenCalledTimes(0);
        expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should throw CryptoRemittanceNotFoundException if crypto remittance does not exist.', async () => {
      const {
        sut,
        mockEmitCreatedRemittanceOrder,
        mockGetByIdCryptoRemittanceRepository,
        mockCreateRemittanceOrderRepository,
        mockGetByNameSystemRepository,
      } = makeSut();

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
        );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      mockGetByIdCryptoRemittanceRepository.mockResolvedValue(null);

      const test = () => sut.execute(cryptoRemittance.id, system);

      await expect(test).rejects.toThrow(CryptoRemittanceNotFoundException);
      expect(mockEmitCreatedRemittanceOrder).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw CryptoRemittanceInvalidStatusException if state is not FILLED.', async () => {
      const {
        sut,
        mockEmitCreatedRemittanceOrder,
        mockGetByIdCryptoRemittanceRepository,
        mockCreateRemittanceOrderRepository,
        mockGetByNameSystemRepository,
      } = makeSut();

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
          {
            status: CryptoRemittanceStatus.WAITING,
          },
        );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      mockGetByIdCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);

      const test = () => sut.execute(cryptoRemittance.id, system);

      await expect(test).rejects.toThrow(
        CryptoRemittanceInvalidStatusException,
      );
      expect(mockEmitCreatedRemittanceOrder).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw SystemNotFoundException if system is not found.', async () => {
      const {
        sut,
        mockEmitCreatedRemittanceOrder,
        mockGetByIdCryptoRemittanceRepository,
        mockCreateRemittanceOrderRepository,
        mockGetByNameSystemRepository,
      } = makeSut();

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
          {
            status: CryptoRemittanceStatus.FILLED,
          },
        );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      mockGetByIdCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);
      mockGetByNameSystemRepository.mockResolvedValue(null);

      const test = () => sut.execute(cryptoRemittance.id, system);

      await expect(test).rejects.toThrow(SystemNotFoundException);
      expect(mockEmitCreatedRemittanceOrder).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should create a new remittance order successfully.', async () => {
      const {
        sut,
        mockEmitCreatedRemittanceOrder,
        mockGetByIdCryptoRemittanceRepository,
        mockCreateRemittanceOrderRepository,
        mockGetByNameSystemRepository,
      } = makeSut();

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
          {
            status: CryptoRemittanceStatus.FILLED,
          },
        );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      mockGetByIdCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);
      mockGetByNameSystemRepository.mockResolvedValue(system);

      await sut.execute(cryptoRemittance.id, system);

      expect(mockEmitCreatedRemittanceOrder).toHaveBeenCalledTimes(1);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(1);
    });
  });
});
