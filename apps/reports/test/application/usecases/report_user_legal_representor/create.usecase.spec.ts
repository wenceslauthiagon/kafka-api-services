import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ReportUserLegalRepresentorEntity,
  ReportUserLegalRepresentorRepository,
} from '@zro/reports/domain';
import { UserLegalRepresentorEntity } from '@zro/users/domain';
import { CreateReportUserLegalRepresentorUseCase as UseCase } from '@zro/reports/application';
import { ReportUserLegalRepresentorFactory } from '@zro/test/reports/config';

describe('CreateReportUserLegalRepresentorUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const reportUserLegalRepresentorRepository: ReportUserLegalRepresentorRepository =
      createMock<ReportUserLegalRepresentorRepository>();
    const mockGetByIdReportUserLegalRepresentorRepository: jest.Mock = On(
      reportUserLegalRepresentorRepository,
    ).get(method((mock) => mock.getById));
    const mockGetReportUserLegalRepresentorRepository: jest.Mock = On(
      reportUserLegalRepresentorRepository,
    ).get(method((mock) => mock.getByUserLegalRepresentor));
    const mockCreateReportUserLegalRepresentorRepository: jest.Mock = On(
      reportUserLegalRepresentorRepository,
    ).get(method((mock) => mock.create));
    const mockUpdateReportUserLegalRepresentorRepository: jest.Mock = On(
      reportUserLegalRepresentorRepository,
    ).get(method((mock) => mock.update));

    return {
      reportUserLegalRepresentorRepository,
      mockGetByIdReportUserLegalRepresentorRepository,
      mockGetReportUserLegalRepresentorRepository,
      mockCreateReportUserLegalRepresentorRepository,
      mockUpdateReportUserLegalRepresentorRepository,
    };
  };

  const makeSut = () => {
    const {
      reportUserLegalRepresentorRepository,
      mockGetByIdReportUserLegalRepresentorRepository,
      mockGetReportUserLegalRepresentorRepository,
      mockCreateReportUserLegalRepresentorRepository,
      mockUpdateReportUserLegalRepresentorRepository,
    } = mockRepository();

    const sut = new UseCase(logger, reportUserLegalRepresentorRepository);

    return {
      sut,
      mockGetByIdReportUserLegalRepresentorRepository,
      mockGetReportUserLegalRepresentorRepository,
      mockCreateReportUserLegalRepresentorRepository,
      mockUpdateReportUserLegalRepresentorRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockGetReportUserLegalRepresentorRepository,
        mockCreateReportUserLegalRepresentorRepository,
        mockUpdateReportUserLegalRepresentorRepository,
      } = makeSut();

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(null, new UserLegalRepresentorEntity({})),
        () =>
          sut.execute(
            uuidV4(),
            new UserLegalRepresentorEntity({ id: uuidV4() }),
          ),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetReportUserLegalRepresentorRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockCreateReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should update if already exists for user successfully', async () => {
      const {
        sut,
        mockGetByIdReportUserLegalRepresentorRepository,
        mockGetReportUserLegalRepresentorRepository,
        mockCreateReportUserLegalRepresentorRepository,
        mockUpdateReportUserLegalRepresentorRepository,
      } = makeSut();

      const reportUserLegalRepresentor =
        await ReportUserLegalRepresentorFactory.create<ReportUserLegalRepresentorEntity>(
          ReportUserLegalRepresentorEntity.name,
        );

      const { id, userLegalRepresentor } = reportUserLegalRepresentor;

      mockGetByIdReportUserLegalRepresentorRepository.mockResolvedValue(null);
      mockGetReportUserLegalRepresentorRepository.mockResolvedValue(
        reportUserLegalRepresentor,
      );

      const result = await sut.execute(id, userLegalRepresentor);

      expect(result).toBeDefined();
      expect(
        mockGetByIdReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetByIdReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledWith(id);
      expect(mockGetReportUserLegalRepresentorRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetReportUserLegalRepresentorRepository).toHaveBeenCalledWith(
        userLegalRepresentor,
      );
      expect(
        mockCreateReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should create successfully', async () => {
      const {
        sut,
        mockGetByIdReportUserLegalRepresentorRepository,
        mockGetReportUserLegalRepresentorRepository,
        mockCreateReportUserLegalRepresentorRepository,
        mockUpdateReportUserLegalRepresentorRepository,
      } = makeSut();

      const reportUserLegalRepresentor =
        await ReportUserLegalRepresentorFactory.create<ReportUserLegalRepresentorEntity>(
          ReportUserLegalRepresentorEntity.name,
        );

      const { id, userLegalRepresentor } = reportUserLegalRepresentor;

      mockGetByIdReportUserLegalRepresentorRepository.mockResolvedValue(null);
      mockGetReportUserLegalRepresentorRepository.mockResolvedValue(null);

      const result = await sut.execute(id, userLegalRepresentor);

      expect(result).toBeDefined();
      expect(
        mockGetByIdReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetByIdReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledWith(id);
      expect(mockGetReportUserLegalRepresentorRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetReportUserLegalRepresentorRepository).toHaveBeenCalledWith(
        userLegalRepresentor,
      );
      expect(
        mockCreateReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockUpdateReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create or updated if already exists', async () => {
      const {
        sut,
        mockGetByIdReportUserLegalRepresentorRepository,
        mockGetReportUserLegalRepresentorRepository,
        mockCreateReportUserLegalRepresentorRepository,
        mockUpdateReportUserLegalRepresentorRepository,
      } = makeSut();

      const reportUserLegalRepresentor =
        await ReportUserLegalRepresentorFactory.create<ReportUserLegalRepresentorEntity>(
          ReportUserLegalRepresentorEntity.name,
        );

      const { id, userLegalRepresentor } = reportUserLegalRepresentor;

      mockGetByIdReportUserLegalRepresentorRepository.mockResolvedValue(
        reportUserLegalRepresentor,
      );

      const result = await sut.execute(id, userLegalRepresentor);

      expect(result).toBeDefined();
      expect(
        mockGetByIdReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetByIdReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledWith(id);
      expect(mockGetReportUserLegalRepresentorRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockCreateReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateReportUserLegalRepresentorRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });
});
