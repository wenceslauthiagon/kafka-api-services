import { Logger } from 'winston';
import {
  IsNotEmpty,
  IsUUID,
  Equals,
  IsString,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsCpfOrCnpj } from '@zro/common';
import {
  User,
  Onboarding,
  OnboardingRepository,
  OnboardingStatus,
} from '@zro/users/domain';
import { GetOnboardingByDocumentAndStatusIsFinishedUseCase as UseCase } from '@zro/users/application';

type TGetOnboardingByDocumentAndStatusIsFinishedRequest = Pick<
  Onboarding,
  'document'
>;

export class GetOnboardingByDocumentAndStatusIsFinishedRequest
  extends AutoValidator
  implements TGetOnboardingByDocumentAndStatusIsFinishedRequest
{
  @IsCpfOrCnpj()
  document: string;

  constructor(props: TGetOnboardingByDocumentAndStatusIsFinishedRequest) {
    super(props);
  }
}

type userId = User['uuid'];

type TGetOnboardingByDocumentAndStatusIsFinishedResponse = Pick<
  Onboarding,
  'id' | 'fullName' | 'status'
> & { userId: userId };

export class GetOnboardingByDocumentAndStatusIsFinishedResponse
  extends AutoValidator
  implements TGetOnboardingByDocumentAndStatusIsFinishedResponse
{
  @IsUUID(4)
  id: string;

  @Equals(OnboardingStatus.FINISHED)
  status: OnboardingStatus;

  @IsUUID(4)
  userId: userId;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  fullName: string;

  constructor(props: TGetOnboardingByDocumentAndStatusIsFinishedResponse) {
    super(props);
  }
}

export class GetOnboardingByDocumentAndStatusIsFinishedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    onboardingRepository: OnboardingRepository,
  ) {
    this.logger = logger.child({
      context: GetOnboardingByDocumentAndStatusIsFinishedController.name,
    });
    this.usecase = new UseCase(this.logger, onboardingRepository);
  }

  async execute(
    request: GetOnboardingByDocumentAndStatusIsFinishedRequest,
  ): Promise<GetOnboardingByDocumentAndStatusIsFinishedResponse> {
    this.logger.debug('Getting onboarding by document request.', { request });

    const { document } = request;

    const onboarding = await this.usecase.execute(document);

    if (!onboarding) return null;

    const response = new GetOnboardingByDocumentAndStatusIsFinishedResponse({
      id: onboarding.id,
      userId: onboarding.user.uuid,
      status: onboarding.status,
      fullName: onboarding.fullName,
    });

    this.logger.debug('Getting onboarding by document response.', { response });

    return response;
  }
}
