import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { SpreadFactory } from '@zro/test/otc/config';
import { SpreadEntity, SpreadRepository } from '@zro/otc/domain';
import {
  GetSpreadByIdUseCase,
  SpreadNotFoundException,
} from '@zro/otc/application';

describe('GetSpreadByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const spreadRepository: SpreadRepository = createMock<SpreadRepository>();
  const mockGetSpreadByIdRepository: jest.Mock = On(spreadRepository).get(
    method((mock) => mock.getById),
  );

  describe('With valid parameters', () => {
    it('TC0001 - Should get spread successfully', async () => {
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
      );

      mockGetSpreadByIdRepository.mockResolvedValue(spread);

      const usecase = new GetSpreadByIdUseCase(logger, spreadRepository);

      const result = await usecase.execute(spread.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(spread.id);
      expect(mockGetSpreadByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadByIdRepository.mock.calls[0][0]).toBe(spread.id);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get deleted spread', async () => {
      mockGetSpreadByIdRepository.mockResolvedValue(null);

      const usecase = new GetSpreadByIdUseCase(logger, spreadRepository);

      const testScript = () => usecase.execute(uuidV4());

      await expect(testScript).rejects.toThrow(SpreadNotFoundException);
      expect(mockGetSpreadByIdRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not get spread without key id', async () => {
      const usecase = new GetSpreadByIdUseCase(logger, spreadRepository);

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetSpreadByIdRepository).toHaveBeenCalledTimes(0);
    });
  });
});
