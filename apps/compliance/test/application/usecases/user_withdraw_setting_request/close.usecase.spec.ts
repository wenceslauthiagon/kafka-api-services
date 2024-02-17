import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import {
  CloseUserWithdrawSettingRequestUseCase as UseCase,
  UserWithdrawSettingRequestEventEmitter,
  UserWithdrawSettingRequestInvalidStateException,
  UserWithdrawSettingRequestNotFoundException,
  UtilService,
} from '@zro/compliance/application';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';

describe('CloseUserWithdrawSettingRequestUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: UserWithdrawSettingRequestEventEmitter =
      createMock<UserWithdrawSettingRequestEventEmitter>();

    const mockApprovedUserWithdrawSettingRequestEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.approved));

    const mockRejectedUserWithdrawSettingRequestEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.rejected));

    return {
      eventEmitter,
      mockApprovedUserWithdrawSettingRequestEvent,
      mockRejectedUserWithdrawSettingRequestEvent,
    };
  };

  const mockRepository = () => {
    const userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository =
      createMock<UserWithdrawSettingRequestRepository>();

    const mockGetUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.getById));

    const mockUpdateUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.update));

    return {
      userWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
      mockUpdateUserWithdrawSettingRequestRepository,
    };
  };

  const mockService = () => {
    const utilService: UtilService = createMock<UtilService>();

    const mockCreateUserWithdrawSettingService: jest.Mock = On(utilService).get(
      method((mock) => mock.createUserWithdrawSetting),
    );

    return {
      utilService,
      mockCreateUserWithdrawSettingService,
    };
  };

  const makeSut = () => {
    const {
      userWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
      mockUpdateUserWithdrawSettingRequestRepository,
    } = mockRepository();

    const {
      eventEmitter,
      mockApprovedUserWithdrawSettingRequestEvent,
      mockRejectedUserWithdrawSettingRequestEvent,
    } = mockEmitter();

    const { utilService, mockCreateUserWithdrawSettingService } = mockService();

    const sut = new UseCase(
      logger,
      userWithdrawSettingRequestRepository,
      eventEmitter,
      utilService,
    );

    return {
      sut,
      mockGetUserWithdrawSettingRequestRepository,
      mockUpdateUserWithdrawSettingRequestRepository,
      mockApprovedUserWithdrawSettingRequestEvent,
      mockRejectedUserWithdrawSettingRequestEvent,
      mockCreateUserWithdrawSettingService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not close if missing params', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockRejectedUserWithdrawSettingRequestEvent,
        mockCreateUserWithdrawSettingService,
      } = makeSut();

      const test = [
        () => sut.execute(null),
        () => sut.execute(new UserWithdrawSettingRequestEntity({})),
        () =>
          sut.execute(
            new UserWithdrawSettingRequestEntity({ id: faker.datatype.uuid() }),
          ),
        () =>
          sut.execute(
            new UserWithdrawSettingRequestEntity({
              analysisResult:
                UserWithdrawSettingRequestAnalysisResultType.APPROVED,
            }),
          ),
        () =>
          sut.execute(
            new UserWithdrawSettingRequestEntity({
              analysisResult:
                UserWithdrawSettingRequestAnalysisResultType.REJECTED,
            }),
          ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockRejectedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateUserWithdrawSettingService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not close if not found', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockRejectedUserWithdrawSettingRequestEvent,
        mockCreateUserWithdrawSettingService,
      } = makeSut();

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);

      const userWithdrawSettingRequest = new UserWithdrawSettingRequestEntity({
        id: faker.datatype.uuid(),
        analysisResult: UserWithdrawSettingRequestAnalysisResultType.APPROVED,
      });

      const test = () => sut.execute(userWithdrawSettingRequest);

      await expect(test).rejects.toThrow(
        UserWithdrawSettingRequestNotFoundException,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockRejectedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateUserWithdrawSettingService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not close if already is closed', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockRejectedUserWithdrawSettingRequestEvent,
        mockCreateUserWithdrawSettingService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.CLOSED,
            analysisResult:
              UserWithdrawSettingRequestAnalysisResultType.APPROVED,
            closedAt: new Date(),
          },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const result = await sut.execute(userWithdrawSettingRequest);

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.analysisResult).toBe(
        userWithdrawSettingRequest.analysisResult,
      );
      expect(result.closedAt).toBe(userWithdrawSettingRequest.closedAt);
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockRejectedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateUserWithdrawSettingService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not close if is invalid state', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockRejectedUserWithdrawSettingRequestEvent,
        mockCreateUserWithdrawSettingService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.FAILED,
            analysisResult:
              UserWithdrawSettingRequestAnalysisResultType.APPROVED,
          },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const test = () => sut.execute(userWithdrawSettingRequest);

      await expect(test).rejects.toThrow(
        UserWithdrawSettingRequestInvalidStateException,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockRejectedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateUserWithdrawSettingService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should close and approve successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockRejectedUserWithdrawSettingRequestEvent,
        mockCreateUserWithdrawSettingService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.OPEN,
            analysisResult:
              UserWithdrawSettingRequestAnalysisResultType.APPROVED,
          },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );
      mockUpdateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const result = await sut.execute(userWithdrawSettingRequest);

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.analysisResult).toBe(
        userWithdrawSettingRequest.analysisResult,
      );
      expect(result.closedAt).toBeDefined();
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(mockRejectedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateUserWithdrawSettingService).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should close and reject successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockRejectedUserWithdrawSettingRequestEvent,
        mockCreateUserWithdrawSettingService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.OPEN,
            analysisResult:
              UserWithdrawSettingRequestAnalysisResultType.REJECTED,
          },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );
      mockUpdateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const result = await sut.execute(userWithdrawSettingRequest);

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.analysisResult).toBe(
        userWithdrawSettingRequest.analysisResult,
      );
      expect(result.closedAt).toBeDefined();
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockRejectedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateUserWithdrawSettingService).toHaveBeenCalledTimes(0);
    });
  });
});
