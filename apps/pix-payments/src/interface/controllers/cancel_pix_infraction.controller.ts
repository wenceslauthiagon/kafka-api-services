import { Logger } from 'winston';
import { IsEnum, IsUUID, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfraction,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import { CancelPixInfractionUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type TCancelPixInfractionRequest = Pick<PixInfraction, 'issueId'>;

export class CancelPixInfractionRequest
  extends AutoValidator
  implements TCancelPixInfractionRequest
{
  @IsInt()
  @IsPositive()
  issueId: number;

  constructor(props: TCancelPixInfractionRequest) {
    super(props);
  }
}

type TPixCancelInfractionResponse = Pick<
  PixInfraction,
  'id' | 'issueId' | 'state' | 'status'
>;

export class CancelPixInfractionResponse
  extends AutoValidator
  implements TPixCancelInfractionResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: TPixCancelInfractionResponse) {
    super(props);
  }
}

export class CancelPixInfractionController {
  /**
   * Handler triggered when Infraction was pending cancelled.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CancelPixInfractionController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      infractionRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: CancelPixInfractionRequest,
  ): Promise<CancelPixInfractionResponse> {
    this.logger.debug('Handle cancel infraction request.', { request });

    const { issueId } = request;

    const infractionUpdated = await this.usecase.execute(issueId);

    if (!infractionUpdated) return null;

    const response = new CancelPixInfractionResponse({
      id: infractionUpdated.id,
      issueId: infractionUpdated.issueId,
      state: infractionUpdated.state,
      status: infractionUpdated.status,
    });

    this.logger.info('Handle pending infraction event by ID response.', {
      infraction: response,
    });

    return response;
  }
}
