import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import { GetPixInfractionByPspIdUseCase as UseCase } from '@zro/pix-payments/application';

type TGetPixInfractionByPspIdRequest = Pick<PixInfraction, 'id'>;

export class GetPixInfractionByPspIdRequest
  extends AutoValidator
  implements TGetPixInfractionByPspIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetPixInfractionByPspIdRequest) {
    super(props);
  }
}

type TGetByIdPspInfractionResponse = Pick<PixInfraction, 'id' | 'state'>;

export class GetPixInfractionByPspIdResponse
  extends AutoValidator
  implements TGetByIdPspInfractionResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: TGetByIdPspInfractionResponse) {
    super(props);
  }
}

export class GetPixInfractionByPspIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
  ) {
    this.logger = logger.child({
      context: GetPixInfractionByPspIdController.name,
    });

    this.usecase = new UseCase(this.logger, infractionRepository);
  }

  async execute(
    request: GetPixInfractionByPspIdRequest,
  ): Promise<GetPixInfractionByPspIdResponse> {
    this.logger.debug('Get infraction by psp id request.', { request });
    const { id } = request;

    const infraction = await this.usecase.execute(id);

    if (!infraction) return null;

    const response = new GetPixInfractionByPspIdResponse({
      id: infraction.id,
      state: infraction.state,
    });

    this.logger.info('Get infraction by psp id response.', {
      infraction: response,
    });

    return response;
  }
}
