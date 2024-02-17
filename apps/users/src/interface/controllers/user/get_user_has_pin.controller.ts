import { Logger } from 'winston';
import { IsBoolean, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserRepository } from '@zro/users/domain';
import { GetUserHasPinUseCase } from '@zro/users/application';

type TGetUserHasPinRequest = Pick<User, 'uuid'>;

export class GetUserHasPinRequest
  extends AutoValidator
  implements TGetUserHasPinRequest
{
  @IsUUID()
  uuid: string;

  constructor(props: TGetUserHasPinRequest) {
    super(props);
  }
}

type TGetUserHasPinResponse = { hasPin: boolean };

export class GetUserHasPinResponse
  extends AutoValidator
  implements TGetUserHasPinResponse
{
  @IsBoolean()
  hasPin: boolean;

  constructor(props: TGetUserHasPinResponse) {
    super(props);
  }
}

export class GetUserHasPinController {
  private usecase: GetUserHasPinUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserHasPinController.name });
    this.usecase = new GetUserHasPinUseCase(this.logger, userRepository);
  }

  async execute(request: GetUserHasPinRequest): Promise<GetUserHasPinResponse> {
    this.logger.debug('Getting user request.', { request });

    const { uuid } = request;

    const userHasPin = await this.usecase.execute(uuid);

    const response = new GetUserHasPinResponse({
      hasPin: userHasPin,
    });

    return response;
  }
}
