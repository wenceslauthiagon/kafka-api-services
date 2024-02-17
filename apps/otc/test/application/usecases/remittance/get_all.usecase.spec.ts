import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import * as moment from 'moment';

import {
  MissingDataException,
  defaultLogger as logger,
  PaginationEntity,
} from '@zro/common';
import { GetAllRemittanceUseCase as UseCase } from '@zro/otc/application';
import {
  RemittanceRepository,
  GetAllRemittanceFilter,
  RemittanceStatus,
  RemittanceSide,
} from '@zro/otc/domain';

describe('GetAllRemittanceExposureRuleUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const remittanceRepository: RemittanceRepository =
      createMock<RemittanceRepository>();
    const mockGetAllByFilterRemittanceRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.getAllByFilter));

    return {
      remittanceRepository,
      mockGetAllByFilterRemittanceRepository,
    };
  };

  const makeSut = () => {
    const { remittanceRepository, mockGetAllByFilterRemittanceRepository } =
      mockRepository();

    const sut = new UseCase(logger, remittanceRepository);

    return {
      sut,
      mockGetAllByFilterRemittanceRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const { sut, mockGetAllByFilterRemittanceRepository } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetAllByFilterRemittanceRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get all remittance with filter successfully.', async () => {
      const { sut, mockGetAllByFilterRemittanceRepository } = makeSut();

      const pagination = new PaginationEntity({});
      const filter: GetAllRemittanceFilter = {
        status: RemittanceStatus.CLOSED,
        side: RemittanceSide.SELL,
        createdAtStart: moment().toDate(),
        createdAtEnd: moment().add(6, 'day').toDate(),
      };

      const test = await sut.execute(pagination, filter);

      expect(test).toBeDefined();
      expect(mockGetAllByFilterRemittanceRepository).toHaveBeenCalledTimes(1);
    });
  });
});
