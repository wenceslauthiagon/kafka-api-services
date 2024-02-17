import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  PixStatementCurrentPageEntity,
  PixStatementCurrentPageRepository,
  PixStatementRepository,
} from '@zro/api-topazio/domain';
import {
  PixStatementGateway,
  UpdatePixStatementUseCase as UseCase,
} from '@zro/api-topazio/application';
import * as MockTestGetStatement from '@zro/test/api-topazio/mocks/get_statement.mock';
import { PixStatementCurrentPageFactory } from '@zro/test/api-topazio/config';

describe('UpdatePixStatementUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      pixStatementRepository,
      pixStatementCurrentPageRepository,
      mockCreatePixStatement,
      mockGetPixStatementCurrentPage,
    } = mockRepository();

    const { pspGateway, mockGetGateway } = mockGateway();

    const sut = new UseCase(
      logger,
      pixStatementRepository,
      pixStatementCurrentPageRepository,
      pspGateway,
    );
    return {
      sut,
      mockCreatePixStatement,
      mockGetGateway,
      mockGetPixStatementCurrentPage,
    };
  };

  const mockRepository = () => {
    const pixStatementRepository: PixStatementRepository =
      createMock<PixStatementRepository>();
    const mockCreatePixStatement: jest.Mock = On(pixStatementRepository).get(
      method((mock) => mock.create),
    );

    const pixStatementCurrentPageRepository: PixStatementCurrentPageRepository =
      createMock<PixStatementCurrentPageRepository>();
    const mockGetPixStatementCurrentPage: jest.Mock = On(
      pixStatementCurrentPageRepository,
    ).get(method((mock) => mock.getCurrentPage));

    return {
      pixStatementRepository,
      mockCreatePixStatement,
      pixStatementCurrentPageRepository,
      mockGetPixStatementCurrentPage,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixStatementGateway = createMock<PixStatementGateway>();
    const mockGetGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.getStatement),
    );

    return {
      pspGateway,
      mockGetGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should update pix statement when there is current page alread saved', async () => {
      const {
        sut,
        mockCreatePixStatement,
        mockGetGateway,
        mockGetPixStatementCurrentPage,
      } = makeSut();

      const pixStatementCurrentPage =
        await PixStatementCurrentPageFactory.create<PixStatementCurrentPageEntity>(
          PixStatementCurrentPageEntity.name,
        );

      mockGetGateway.mockImplementation(MockTestGetStatement.success);
      mockGetPixStatementCurrentPage.mockResolvedValue(pixStatementCurrentPage);

      const result = await sut.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.page).toBe(1);
        expect(res.size).toBe(1);
        expect(res.statements.length).toBe(1);
      });
      expect(mockCreatePixStatement).toHaveBeenCalledTimes(1);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockGetPixStatementCurrentPage).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should update pix statement when not exists current page already saved', async () => {
      const {
        sut,
        mockCreatePixStatement,
        mockGetGateway,
        mockGetPixStatementCurrentPage,
      } = makeSut();

      mockGetGateway.mockImplementation(MockTestGetStatement.success);
      mockGetPixStatementCurrentPage.mockResolvedValue(undefined);

      const result = await sut.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.page).toBe(1);
        expect(res.size).toBe(1);
        expect(res.statements.length).toBe(1);
      });
      expect(mockCreatePixStatement).toHaveBeenCalledTimes(1);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockGetPixStatementCurrentPage).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should update pix statement when there is at least one page saved but not exists new pages', async () => {
      const {
        sut,
        mockCreatePixStatement,
        mockGetGateway,
        mockGetPixStatementCurrentPage,
      } = makeSut();

      const pixStatementCurrentPage =
        await PixStatementCurrentPageFactory.create<PixStatementCurrentPageEntity>(
          PixStatementCurrentPageEntity.name,
        );

      mockGetGateway.mockResolvedValue([]);
      mockGetPixStatementCurrentPage.mockResolvedValue(pixStatementCurrentPage);

      const result = await sut.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.page).toBe(1);
        expect(res.size).toBe(1);
        expect(res.statements.length).toBe(1);
      });
      expect(mockCreatePixStatement).toHaveBeenCalledTimes(0);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockGetPixStatementCurrentPage).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should update pix statement when there is at least one page saved but more records were included on the same page', async () => {
      const {
        sut,
        mockCreatePixStatement,
        mockGetGateway,
        mockGetPixStatementCurrentPage,
      } = makeSut();

      const pixStatementCurrentPage =
        await PixStatementCurrentPageFactory.create<PixStatementCurrentPageEntity>(
          PixStatementCurrentPageEntity.name,
        );

      mockGetGateway.mockResolvedValue([
        MockTestGetStatement.success,
        MockTestGetStatement.success,
      ]);
      mockGetPixStatementCurrentPage.mockResolvedValue(pixStatementCurrentPage);

      const result = await sut.execute();

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res.page).toBe(1);
        expect(res.size).toBe(2);
        expect(res.statements.length).toBe(2);
      });
      expect(mockCreatePixStatement).toHaveBeenCalledTimes(1);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockGetPixStatementCurrentPage).toHaveBeenCalledTimes(1);
    });
  });
});
