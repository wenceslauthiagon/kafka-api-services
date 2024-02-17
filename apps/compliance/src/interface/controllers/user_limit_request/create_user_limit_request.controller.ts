import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  UserLimitRequest,
  UserLimitRequestEntity,
  UserLimitRequestRepository,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import { UserEntity } from '@zro/users/domain';
import { AutoValidator } from '@zro/common';
import {
  IsUUID,
  IsOptional,
  IsInt,
  IsDate,
  IsEnum,
  IsString,
  Length,
} from 'class-validator';
import {
  CreateUserLimitRequestUseCase,
  UserLimitRequestService,
} from '@zro/compliance/application';
import {
  UserLimitRequestEventEmitterController,
  UserLimitRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import { UserLimitEntity } from '@zro/operations/domain';

type TCreateUserLimitRequest = Omit<
  UserLimitRequest,
  'user' | 'userLimit' | 'status' | 'state' | 'limitTypeDescription'
> & {
  userId: string;
  userLimitId: string;
};

export class CreateUserLimitRequest
  extends AutoValidator
  implements TCreateUserLimitRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  userLimitId: string;

  @IsOptional()
  @IsInt()
  requestYearlyLimit?: number;

  @IsOptional()
  @IsInt()
  requestMonthlyLimit?: number;

  @IsOptional()
  @IsInt()
  requestDailyLimit?: number;

  @IsOptional()
  @IsInt()
  requestNightlyLimit?: number;

  @IsOptional()
  @IsInt()
  requestMaxAmount?: number;

  @IsOptional()
  @IsInt()
  requestMinAmount?: number;

  @IsOptional()
  @IsInt()
  requestMaxAmountNightly?: number;

  @IsOptional()
  @IsInt()
  requestMinAmountNightly?: number;

  constructor(props: TCreateUserLimitRequest) {
    super(props);
  }
}

type TCreateUserLimitRequestResponse = Omit<
  UserLimitRequest,
  'user' | 'userLimit'
> & {
  id: string;
  userId: string;
  userLimitId: string;
};

export class CreateUserLimitRequestResponse
  extends AutoValidator
  implements TCreateUserLimitRequestResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(UserLimitRequestStatus)
  status: UserLimitRequestStatus;

  @IsEnum(UserLimitRequestState)
  state: UserLimitRequestState;

  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  userLimitId: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  limitTypeDescription: string;

  @IsOptional()
  @IsInt()
  requestYearlyLimit?: number;

  @IsOptional()
  @IsInt()
  requestMonthlyLimit?: number;

  @IsOptional()
  @IsInt()
  requestDailyLimit?: number;

  @IsOptional()
  @IsInt()
  requestNightlyLimit?: number;

  @IsOptional()
  @IsInt()
  requestMaxAmount?: number;

  @IsOptional()
  @IsInt()
  requestMinAmount?: number;

  @IsOptional()
  @IsInt()
  requestMaxAmountNightly?: number;

  @IsOptional()
  @IsInt()
  requestMinAmountNightly?: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  constructor(props: TCreateUserLimitRequestResponse) {
    super(props);
  }
}

export class CreateUserLimitRequestController {
  private usecase: CreateUserLimitRequestUseCase;

  constructor(
    private logger: Logger,
    private readonly userLimitRequestRepository: UserLimitRequestRepository,
    private readonly userLimitRequestEventEmitter: UserLimitRequestEventEmitterControllerInterface,
    private readonly userLimitRequestService: UserLimitRequestService,
  ) {
    this.logger = logger.child({
      context: CreateUserLimitRequestController.name,
    });

    const controllerUserLimitRequestEventEmitter =
      new UserLimitRequestEventEmitterController(
        this.userLimitRequestEventEmitter,
      );

    this.usecase = new CreateUserLimitRequestUseCase(
      this.logger,
      this.userLimitRequestRepository,
      controllerUserLimitRequestEventEmitter,
      this.userLimitRequestService,
    );
  }

  async execute(
    request: CreateUserLimitRequest,
  ): Promise<CreateUserLimitRequestResponse> {
    this.logger.debug('Create User limit request.', { request });

    const { userId, userLimitId, ...restOfParams } = request;

    const user = new UserEntity({ uuid: userId });

    const userLimit = new UserLimitEntity({ id: userLimitId });

    const id = uuidV4();

    const userLimitRequest = new UserLimitRequestEntity({
      ...restOfParams,
      user,
      userLimit,
      id,
    });

    const createdUserLimitRequest =
      await this.usecase.execute(userLimitRequest);

    const response = new CreateUserLimitRequestResponse({
      id: createdUserLimitRequest.id,
      status: createdUserLimitRequest.status,
      state: createdUserLimitRequest.state,
      userId: userId,
      userLimitId: createdUserLimitRequest.userLimit?.id,
      limitTypeDescription: createdUserLimitRequest.limitTypeDescription,
      requestYearlyLimit: createdUserLimitRequest.requestYearlyLimit,
      requestMonthlyLimit: createdUserLimitRequest.requestMonthlyLimit,
      requestDailyLimit: createdUserLimitRequest.requestDailyLimit,
      requestNightlyLimit: createdUserLimitRequest.requestNightlyLimit,
      requestMaxAmount: createdUserLimitRequest.requestMaxAmount,
      requestMinAmount: createdUserLimitRequest.requestMinAmount,
      requestMaxAmountNightly: createdUserLimitRequest.requestMaxAmountNightly,
      requestMinAmountNightly: createdUserLimitRequest.requestMinAmountNightly,
      createdAt: createdUserLimitRequest.createdAt,
      updatedAt: createdUserLimitRequest.updatedAt,
    });

    this.logger.info('Create user limit request response.', {
      user: response,
    });

    return response;
  }
}
