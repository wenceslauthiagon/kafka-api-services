import { Logger } from 'winston';
import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsUUID,
  Length,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  Address,
  Onboarding,
  OnboardingRepository,
  OnboardingStatus,
  User,
  UserEntity,
} from '@zro/users/domain';
import { GetOnboardingByUserAndStatusIsFinishedUseCase } from '@zro/users/application';

type TGetOnboardingByUserAndStatusIsFinishedRequest = {
  userId: Pick<User, 'uuid'>['uuid'];
};
export class GetOnboardingByUserAndStatusIsFinishedRequest
  extends AutoValidator
  implements TGetOnboardingByUserAndStatusIsFinishedRequest
{
  @IsUUID(4)
  userId: string;

  constructor(props: TGetOnboardingByUserAndStatusIsFinishedRequest) {
    super(props);
  }
}

type AddressId = Pick<Address, 'id'>['id'];
type UserId = Pick<User, 'uuid'>['uuid'];

type TGetOnboardingByUserAndStatusIsFinishedResponse = Pick<
  Onboarding,
  | 'id'
  | 'status'
  | 'fullName'
  | 'branch'
  | 'accountNumber'
  | 'createdAt'
  | 'updatedAt'
> & { userId: UserId; addressId?: AddressId };

export class GetOnboardingByUserAndStatusIsFinishedResponse
  extends AutoValidator
  implements TGetOnboardingByUserAndStatusIsFinishedResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(OnboardingStatus)
  status: OnboardingStatus;

  @IsUUID(4)
  userId: string;

  @IsOptional()
  fullName?: string;

  @IsOptional()
  @Length(4, 4)
  branch?: string;

  @IsOptional()
  @IsNotEmpty()
  accountNumber?: string;

  @IsOptional()
  @IsPositive()
  addressId?: number;

  @IsDefined()
  createdAt: Date;

  @IsDefined()
  updatedAt: Date;

  constructor(props: TGetOnboardingByUserAndStatusIsFinishedResponse) {
    super(props);
  }
}

export class GetOnboardingByUserAndStatusIsFinishedController {
  private usecase: GetOnboardingByUserAndStatusIsFinishedUseCase;

  constructor(
    private logger: Logger,
    onboardingRepository: OnboardingRepository,
  ) {
    this.logger = logger.child({
      context: GetOnboardingByUserAndStatusIsFinishedController.name,
    });
    this.usecase = new GetOnboardingByUserAndStatusIsFinishedUseCase(
      this.logger,
      onboardingRepository,
    );
  }

  async execute(
    request: GetOnboardingByUserAndStatusIsFinishedRequest,
  ): Promise<GetOnboardingByUserAndStatusIsFinishedResponse> {
    this.logger.debug('Getting onboarding by user request.', { request });

    const { userId } = request;

    const user = new UserEntity({ uuid: userId });

    const onboarding = await this.usecase.execute(user);

    if (!onboarding) return null;

    const response = new GetOnboardingByUserAndStatusIsFinishedResponse({
      id: onboarding.id,
      status: onboarding.status,
      userId: user.uuid,
      fullName: onboarding.fullName,
      branch: onboarding.branch,
      accountNumber: onboarding.accountNumber,
      addressId: onboarding.address?.id ?? null,
      createdAt: onboarding.createdAt,
      updatedAt: onboarding.updatedAt,
    });

    return response;
  }
}
