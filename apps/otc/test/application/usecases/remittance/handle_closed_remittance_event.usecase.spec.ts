import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  CryptoOrderEntity,
  CryptoOrderRepository,
  CryptoRemittanceEntity,
  CryptoRemittanceRepository,
  RemittanceEntity,
  RemittanceOrderRemittanceEntity,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
  RemittanceRepository,
  RemittanceStatus,
  SystemEntity,
} from '@zro/otc/domain';
import {
  CryptoRemittanceNotFoundException,
  HandleClosedRemittanceEventUseCase as UseCase,
  OtcBotService,
  RemittanceNotFoundException,
  RemittanceInvalidStatusException,
} from '@zro/otc/application';
import {
  CryptoOrderFactory,
  CryptoRemittanceFactory,
  RemittanceFactory,
  RemittanceOrderRemittanceFactory,
  SystemFactory,
} from '@zro/test/otc/config';

describe('HandleClosedRemittanceEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const remittanceRepository: RemittanceRepository =
      createMock<RemittanceRepository>();
    const mockGetByIdRemittanceRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.getById));
    const remittanceOrderRepository: RemittanceOrderRepository =
      createMock<RemittanceOrderRepository>();
    const mockGetByIdRemittanceOrderRepository: jest.Mock = On(
      remittanceOrderRepository,
    ).get(method((mock) => mock.getById));
    const remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository =
      createMock<RemittanceOrderRemittanceRepository>();
    const mockGetAllByRemittanceRemittanceOrderRemittanceRepository: jest.Mock =
      On(remittanceOrderRemittanceRepository).get(
        method((mock) => mock.getAllByRemittance),
      );
    const cryptoRemittanceRepository: CryptoRemittanceRepository =
      createMock<CryptoRemittanceRepository>();
    const mockGetByIdCryptoRemittanceRepository: jest.Mock = On(
      cryptoRemittanceRepository,
    ).get(method((mock) => mock.getById));
    const cryptoOrderRepository: CryptoOrderRepository =
      createMock<CryptoOrderRepository>();
    const mockGetAllByCryptoRemittanceCryptoOrderRepository: jest.Mock = On(
      cryptoOrderRepository,
    ).get(method((mock) => mock.getAllByCryptoRemittance));

    return {
      remittanceRepository,
      mockGetByIdRemittanceRepository,
      remittanceOrderRepository,
      mockGetByIdRemittanceOrderRepository,
      remittanceOrderRemittanceRepository,
      mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      cryptoRemittanceRepository,
      mockGetByIdCryptoRemittanceRepository,
      cryptoOrderRepository,
      mockGetAllByCryptoRemittanceCryptoOrderRepository,
    };
  };

  const mockService = () => {
    const otcBotService: OtcBotService = createMock<OtcBotService>();

    const mockUpdateBotOtcOrderByRemittanceOtcBotService: jest.Mock = On(
      otcBotService,
    ).get(method((mock) => mock.updateBotOtcOrderByRemittance));

    return {
      otcBotService,
      mockUpdateBotOtcOrderByRemittanceOtcBotService,
    };
  };

  const makeSut = () => {
    const {
      remittanceRepository,
      mockGetByIdRemittanceRepository,
      remittanceOrderRepository,
      mockGetByIdRemittanceOrderRepository,
      remittanceOrderRemittanceRepository,
      mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      cryptoRemittanceRepository,
      mockGetByIdCryptoRemittanceRepository,
      cryptoOrderRepository,
      mockGetAllByCryptoRemittanceCryptoOrderRepository,
    } = mockRepository();

    const { otcBotService, mockUpdateBotOtcOrderByRemittanceOtcBotService } =
      mockService();

    const sut = new UseCase(
      logger,
      remittanceRepository,
      remittanceOrderRepository,
      remittanceOrderRemittanceRepository,
      cryptoRemittanceRepository,
      cryptoOrderRepository,
      otcBotService,
    );

    return {
      sut,
      mockGetByIdRemittanceRepository,
      mockGetByIdRemittanceOrderRepository,
      mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      mockGetByIdCryptoRemittanceRepository,
      mockGetAllByCryptoRemittanceCryptoOrderRepository,
      mockUpdateBotOtcOrderByRemittanceOtcBotService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockGetByIdRemittanceRepository,
        mockGetByIdRemittanceOrderRepository,
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        mockGetByIdCryptoRemittanceRepository,
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
      );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(remittance, null),
        () => sut.execute(null, system),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllByCryptoRemittanceCryptoOrderRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockUpdateBotOtcOrderByRemittanceOtcBotService,
        ).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should return if Bot Otc system ID is different of remittance system ID.', async () => {
      const {
        sut,
        mockGetByIdRemittanceRepository,
        mockGetByIdRemittanceOrderRepository,
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        mockGetByIdCryptoRemittanceRepository,
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
      );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      await sut.execute(remittance, system);

      expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw RemittanceNotFoundException if remittance not found.', async () => {
      const {
        sut,
        mockGetByIdRemittanceRepository,
        mockGetByIdRemittanceOrderRepository,
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        mockGetByIdCryptoRemittanceRepository,
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      } = makeSut();

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { system },
      );

      mockGetByIdRemittanceRepository.mockResolvedValue(null);

      const test = () => sut.execute(remittance, system);

      await expect(test).rejects.toThrow(RemittanceNotFoundException);
      expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw RemittanceInvalidStatusException if remittance status is not CLOSED.', async () => {
      const {
        sut,
        mockGetByIdRemittanceRepository,
        mockGetByIdRemittanceOrderRepository,
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        mockGetByIdCryptoRemittanceRepository,
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      } = makeSut();

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { system },
      );

      mockGetByIdRemittanceRepository.mockResolvedValue(remittance.id);

      const test = () => sut.execute(remittance, system);

      await expect(test).rejects.toThrow(RemittanceInvalidStatusException);
      expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should return if Remittance order remittances not found.', async () => {
      const {
        sut,
        mockGetByIdRemittanceRepository,
        mockGetByIdRemittanceOrderRepository,
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        mockGetByIdCryptoRemittanceRepository,
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      } = makeSut();

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.CLOSED, system },
      );

      mockGetByIdRemittanceRepository.mockResolvedValue(remittance);

      mockGetAllByRemittanceRemittanceOrderRemittanceRepository.mockResolvedValue(
        null,
      );

      await sut.execute(remittance, system);

      expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should return if Remittance order not found.', async () => {
      const {
        sut,
        mockGetByIdRemittanceRepository,
        mockGetByIdRemittanceOrderRepository,
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        mockGetByIdCryptoRemittanceRepository,
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      } = makeSut();

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.CLOSED, system },
      );

      mockGetByIdRemittanceRepository.mockResolvedValue(remittance);

      const remittanceOrderRemittances =
        RemittanceOrderRemittanceFactory.createMany<RemittanceOrderRemittanceEntity>(
          RemittanceOrderRemittanceEntity.name,
          5,
          remittance,
        );

      mockGetAllByRemittanceRemittanceOrderRemittanceRepository.mockResolvedValue(
        remittanceOrderRemittances,
      );

      mockGetByIdRemittanceOrderRepository.mockResolvedValue(null);

      await sut.execute(remittance, system);

      expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should throw CryptoRemittanceNotFoundException if Crypto Remittance not found.', async () => {
      const {
        sut,
        mockGetByIdRemittanceRepository,
        mockGetByIdRemittanceOrderRepository,
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        mockGetByIdCryptoRemittanceRepository,
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      } = makeSut();

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.CLOSED, system },
      );

      mockGetByIdRemittanceRepository.mockResolvedValue(remittance);

      const remittanceOrderRemittances =
        await RemittanceOrderRemittanceFactory.createMany<RemittanceOrderRemittanceEntity>(
          RemittanceOrderRemittanceEntity.name,
          1,
          remittance,
        );

      mockGetAllByRemittanceRemittanceOrderRemittanceRepository.mockResolvedValue(
        remittanceOrderRemittances,
      );

      mockGetByIdRemittanceOrderRepository.mockResolvedValue(
        remittanceOrderRemittances[0].remittanceOrder,
      );

      mockGetByIdCryptoRemittanceRepository.mockResolvedValue(null);

      const test = () => sut.execute(remittance, system);

      await expect(test).rejects.toThrow(CryptoRemittanceNotFoundException);
      expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should throw if Crypto orders not found.', async () => {
      const {
        sut,
        mockGetByIdRemittanceRepository,
        mockGetByIdRemittanceOrderRepository,
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        mockGetByIdCryptoRemittanceRepository,
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      } = makeSut();

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.CLOSED, system },
      );

      mockGetByIdRemittanceRepository.mockResolvedValue(remittance);

      const remittanceOrderRemittances =
        await RemittanceOrderRemittanceFactory.createMany<RemittanceOrderRemittanceEntity>(
          RemittanceOrderRemittanceEntity.name,
          1,
          remittance,
        );

      mockGetAllByRemittanceRemittanceOrderRemittanceRepository.mockResolvedValue(
        remittanceOrderRemittances,
      );

      mockGetByIdRemittanceOrderRepository.mockResolvedValue(
        remittanceOrderRemittances[0].remittanceOrder,
      );

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
          {
            id: remittanceOrderRemittances[0].remittanceOrder.id,
          },
        );

      mockGetByIdCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);

      mockGetAllByCryptoRemittanceCryptoOrderRepository.mockResolvedValue(null);

      await sut.execute(remittance, system);

      expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0009 - Should throw if Crypto orders not found.', async () => {
      const {
        sut,
        mockGetByIdRemittanceRepository,
        mockGetByIdRemittanceOrderRepository,
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
        mockGetByIdCryptoRemittanceRepository,
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      } = makeSut();

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        {
          status: RemittanceStatus.CLOSED,
          system,
          bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
        },
      );

      mockGetByIdRemittanceRepository.mockResolvedValue(remittance);

      const remittanceOrderRemittances =
        await RemittanceOrderRemittanceFactory.createMany<RemittanceOrderRemittanceEntity>(
          RemittanceOrderRemittanceEntity.name,
          1,
          remittance,
        );

      mockGetAllByRemittanceRemittanceOrderRemittanceRepository.mockResolvedValue(
        remittanceOrderRemittances,
      );

      mockGetByIdRemittanceOrderRepository.mockResolvedValue(
        remittanceOrderRemittances[0].remittanceOrder,
      );

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
          {
            id: remittanceOrderRemittances[0].remittanceOrder.id,
          },
        );

      mockGetByIdCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);

      const cryptoOrders =
        await CryptoOrderFactory.createMany<CryptoOrderEntity>(
          CryptoOrderEntity.name,
          2,
        );

      mockGetAllByCryptoRemittanceCryptoOrderRepository.mockResolvedValue(
        cryptoOrders,
      );

      await sut.execute(remittance, system);

      expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllByRemittanceRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetByIdCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllByCryptoRemittanceCryptoOrderRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockUpdateBotOtcOrderByRemittanceOtcBotService,
      ).toHaveBeenCalledTimes(2);
    });
  });
});
