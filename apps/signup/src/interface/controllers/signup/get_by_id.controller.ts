import { Logger } from 'winston';
import { Signup, SignupRepository, SignupState } from '@zro/signup/domain';
import { AutoValidator } from '@zro/common';
import { IsUUID, IsEnum } from 'class-validator';

import { GetSignupByIdUseCase } from '@zro/signup/application';

type TGetSignupByIdRequest = Pick<Signup, 'id'>;

export class GetSignupByIdRequest
  extends AutoValidator
  implements TGetSignupByIdRequest
{
  @IsUUID()
  id: string;

  constructor(props: TGetSignupByIdRequest) {
    super(props);
  }
}

type TGetSignupByIdResponse = Pick<Signup, 'id' | 'state'>;

export class GetSignupByIdResponse
  extends AutoValidator
  implements TGetSignupByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(SignupState)
  state: SignupState;

  constructor(props: TGetSignupByIdResponse) {
    super(props);
  }
}

export class GetSignupByIdController {
  private usecase: GetSignupByIdUseCase;

  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
  ) {
    this.logger = logger.child({
      context: GetSignupByIdController.name,
    });
    this.usecase = new GetSignupByIdUseCase(this.logger, this.signupRepository);
  }

  async execute(request: GetSignupByIdRequest): Promise<GetSignupByIdResponse> {
    this.logger.debug('Get signup by id request.', { request });

    const { id } = request;

    const createSignup = await this.usecase.execute(id);

    if (!createSignup) {
      return null;
    }

    const response = new GetSignupByIdResponse({
      id: createSignup.id,
      state: createSignup.state,
    });

    this.logger.info('Get signup by id response.', {
      signup: response,
    });

    return response;
  }
}
