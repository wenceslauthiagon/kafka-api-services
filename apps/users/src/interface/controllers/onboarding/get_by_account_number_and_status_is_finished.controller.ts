import { Logger } from 'winston';
import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  Onboarding,
  OnboardingRepository,
  OnboardingStatus,
  User,
} from '@zro/users/domain';
import { GetOnboardingByAccountNumberAndStatusIsFinishedUseCase } from '@zro/users/application';

type TGetOnboardingByAccountNumberAndStatusIsFinishedRequest = {
  accountNumber: Pick<Onboarding, 'accountNumber'>['accountNumber'];
};

export class GetOnboardingByAccountNumberAndStatusIsFinishedRequest
  extends AutoValidator
  implements TGetOnboardingByAccountNumberAndStatusIsFinishedRequest
{
  @IsString()
  @MaxLength(255)
  accountNumber: string;

  constructor(props: TGetOnboardingByAccountNumberAndStatusIsFinishedRequest) {
    super(props);
  }
}

type UserId = Pick<User, 'uuid'>['uuid'];

type TGetOnboardingByAccountNumberAndStatusIsFinishedResponse = Pick<
  Onboarding,
  'id' | 'status'
> & { userId: UserId };

export class GetOnboardingByAccountNumberAndStatusIsFinishedResponse
  extends AutoValidator
  implements TGetOnboardingByAccountNumberAndStatusIsFinishedResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(OnboardingStatus)
  status: OnboardingStatus;

  @IsUUID(4)
  userId: string;

  constructor(props: TGetOnboardingByAccountNumberAndStatusIsFinishedResponse) {
    super(props);
  }
}

export class GetOnboardingByAccountNumberAndStatusIsFinishedController {
  private usecase: GetOnboardingByAccountNumberAndStatusIsFinishedUseCase;

  constructor(
    private logger: Logger,
    onboardingRepository: OnboardingRepository,
  ) {
    this.logger = logger.child({
      context: GetOnboardingByAccountNumberAndStatusIsFinishedController.name,
    });
    this.usecase = new GetOnboardingByAccountNumberAndStatusIsFinishedUseCase(
      this.logger,
      onboardingRepository,
    );
  }

  async execute(
    request: GetOnboardingByAccountNumberAndStatusIsFinishedRequest,
  ): Promise<GetOnboardingByAccountNumberAndStatusIsFinishedResponse> {
    this.logger.debug('Getting onboarding by account number request.', {
      request,
    });

    const { accountNumber } = request;

    const onboarding = await this.usecase.execute(accountNumber);

    if (!onboarding) return null;

    const response =
      new GetOnboardingByAccountNumberAndStatusIsFinishedResponse({
        id: onboarding.id,
        status: onboarding.status,
        userId: onboarding.user.uuid,
      });

    return response;
  }
}
