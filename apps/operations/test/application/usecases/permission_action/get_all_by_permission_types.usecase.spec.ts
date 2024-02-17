import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  PaginationEntity,
  defaultLogger as logger,
  paginationToDomain,
} from '@zro/common';
import {
  PermissionActionEntity,
  PermissionActionRepository,
} from '@zro/operations/domain';
import { GetAllPermissionActionByPermissionTypesUseCase as UseCase } from '@zro/operations/application';
import { PermissionActionFactory } from '@zro/test/operations/config';

describe('GetAllPermissionActionByPermissionTypesUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const permissionActionRepository: PermissionActionRepository =
      createMock<PermissionActionRepository>();
    const mockGetAllRepository: jest.Mock = On(permissionActionRepository).get(
      method((mock) => mock.getAllByFilter),
    );

    return {
      permissionActionRepository,
      mockGetAllRepository,
    };
  };

  const makeSut = () => {
    const { permissionActionRepository, mockGetAllRepository } =
      mockRepository();

    const ROOT = 'ROOT';

    const sut = new UseCase(logger, permissionActionRepository, ROOT);
    return {
      sut,
      mockGetAllRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get permission actions if missing data', async () => {
      const { sut, mockGetAllRepository } = makeSut();

      await expect(() => sut.execute(null)).rejects.toThrow(
        MissingDataException,
      );

      expect(mockGetAllRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get all permission actions successfully ', async () => {
      const { sut, mockGetAllRepository } = makeSut();

      const pagination = new PaginationEntity();
      const permissionActions =
        await PermissionActionFactory.createMany<PermissionActionEntity>(
          PermissionActionEntity.name,
          3,
        );

      mockGetAllRepository.mockResolvedValue(
        paginationToDomain(
          pagination,
          permissionActions.length,
          permissionActions,
        ),
      );

      const result = await sut.execute(pagination);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.tag).toBeDefined();
      });
      expect(mockGetAllRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllRepository).toBeCalledWith(pagination, undefined);
    });
  });
});
