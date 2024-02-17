import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  AddressRepository,
  OccupationRepository,
  OnboardingEntity,
  OnboardingRepository,
  UserEntity,
  UserLegalRepresentorRepository,
  UserRepository,
  UserLegalAdditionalInfoRepository,
  UserState,
  UserLegalAdditionalInfoEntity,
} from '@zro/users/domain';
import {
  ReportService,
  SyncUserActiveUseCase as UseCase,
} from '@zro/users/application';
import {
  OnboardingFactory,
  UserFactory,
  UserLegalAdditionalInfoFactory,
} from '@zro/test/users/config';

describe('SyncUserActiveUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userRepository: UserRepository = createMock<UserRepository>();
    const mockGetAllActiveUsers: jest.Mock = On(userRepository).get(
      method((mock) => mock.getAllActiveAndBankOnboardingStateIsCompleteUsers),
    );

    const addressRepository: AddressRepository =
      createMock<AddressRepository>();
    const mockGetAddressByUser: jest.Mock = On(addressRepository).get(
      method((mock) => mock.getByUser),
    );

    const onboardingRepository: OnboardingRepository =
      createMock<OnboardingRepository>();
    const mockGetOnboardingByUser: jest.Mock = On(onboardingRepository).get(
      method((mock) => mock.getByUserAndStatusIsFinished),
    );

    const userLegalRepresentorRepository: UserLegalRepresentorRepository =
      createMock<UserLegalRepresentorRepository>();
    const mockGetAllByUser: jest.Mock = On(userLegalRepresentorRepository).get(
      method((mock) => mock.getAllByUser),
    );

    const occupationRepository: OccupationRepository =
      createMock<OccupationRepository>();
    const mockGetOccupationByCodCbo: jest.Mock = On(occupationRepository).get(
      method((mock) => mock.getByCodCbo),
    );

    const userLegalAdditionalInfoRepository: UserLegalAdditionalInfoRepository =
      createMock<UserLegalAdditionalInfoRepository>();
    const mockGetUserLegalAdditionalInfoByUser: jest.Mock = On(
      userLegalAdditionalInfoRepository,
    ).get(method((mock) => mock.getByUser));

    return {
      userRepository,
      mockGetAllActiveUsers,
      addressRepository,
      mockGetAddressByUser,
      onboardingRepository,
      mockGetOnboardingByUser,
      userLegalRepresentorRepository,
      mockGetAllByUser,
      occupationRepository,
      mockGetOccupationByCodCbo,
      userLegalAdditionalInfoRepository,
      mockGetUserLegalAdditionalInfoByUser,
    };
  };

  const mockService = () => {
    const reportService: ReportService = createMock<ReportService>();
    const mockCreateReportUserService: jest.Mock = On(reportService).get(
      method((mock) => mock.createReportUser),
    );

    return {
      reportService,
      mockCreateReportUserService,
    };
  };

  const makeSut = () => {
    const {
      userRepository,
      mockGetAllActiveUsers,
      addressRepository,
      mockGetAddressByUser,
      onboardingRepository,
      mockGetOnboardingByUser,
      userLegalRepresentorRepository,
      mockGetAllByUser,
      occupationRepository,
      mockGetOccupationByCodCbo,
      userLegalAdditionalInfoRepository,
      mockGetUserLegalAdditionalInfoByUser,
    } = mockRepository();

    const { reportService, mockCreateReportUserService } = mockService();

    const sut = new UseCase(
      logger,
      userRepository,
      addressRepository,
      onboardingRepository,
      userLegalRepresentorRepository,
      occupationRepository,
      userLegalAdditionalInfoRepository,
      reportService,
    );

    return {
      sut,
      mockGetAllActiveUsers,
      mockGetAddressByUser,
      mockGetOnboardingByUser,
      mockCreateReportUserService,
      mockGetAllByUser,
      mockGetOccupationByCodCbo,
      mockGetUserLegalAdditionalInfoByUser,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should sync successfully', async () => {
      const {
        sut,
        mockGetAllActiveUsers,
        mockGetAddressByUser,
        mockGetOnboardingByUser,
        mockCreateReportUserService,
        mockGetAllByUser,
        mockGetOccupationByCodCbo,
        mockGetUserLegalAdditionalInfoByUser,
      } = makeSut();

      const users = await UserFactory.createMany<UserEntity>(
        UserEntity.name,
        10,
        { state: UserState.ACTIVE },
      );

      mockGetAllActiveUsers.mockResolvedValueOnce({
        data: users,
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 2,
      });

      mockGetOnboardingByUser.mockResolvedValue(
        await OnboardingFactory.create<OnboardingEntity>(OnboardingEntity.name),
      );

      mockGetUserLegalAdditionalInfoByUser.mockResolvedValue(
        await UserLegalAdditionalInfoFactory.create<UserLegalAdditionalInfoEntity>(
          UserLegalAdditionalInfoEntity.name,
        ),
      );

      await sut.execute();

      expect(mockGetAllActiveUsers).toHaveBeenCalledTimes(1);
      expect(mockGetAddressByUser).toHaveBeenCalledTimes(10);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(10);
      expect(mockGetUserLegalAdditionalInfoByUser).toHaveBeenCalledTimes(10);
      expect(mockCreateReportUserService).toHaveBeenCalledTimes(10);
      expect(mockGetAllByUser).toHaveBeenCalledTimes(0);
      expect(mockGetOccupationByCodCbo).toHaveBeenCalledTimes(10);
    });
  });
});
