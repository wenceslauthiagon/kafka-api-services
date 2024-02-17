import { Logger } from 'winston';
import {
  UserLimitRequest,
  UserLimitRequestAnalysisResultType,
  UserLimitRequestEntity,
  UserLimitRequestRepository,
} from '@zro/compliance/domain';
import { CloseUserLimitRequestUseCase } from '@zro/compliance/application';
import {
  UserLimitRequestEventEmitterController,
  UserLimitRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import { AutoValidator } from '@zro/common';
import { IsEnum, IsUUID } from 'class-validator';

type TCloseUserLimitRequest = Pick<UserLimitRequest, 'id' | 'analysisResult'>;

export class CloseUserLimitRequest
  extends AutoValidator
  implements TCloseUserLimitRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(UserLimitRequestAnalysisResultType)
  analysisResult: UserLimitRequestAnalysisResultType;

  constructor(props: TCloseUserLimitRequest) {
    super(props);
  }
}

export class CloseUserLimitRequestController {
  private usecase: CloseUserLimitRequestUseCase;

  constructor(
    private logger: Logger,
    private readonly userLimitRequestRepository: UserLimitRequestRepository,
    private readonly userLimitRequestEventEmitter: UserLimitRequestEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CloseUserLimitRequestController.name,
    });

    const controllerUserLimitRequestEventEmitter =
      new UserLimitRequestEventEmitterController(
        this.userLimitRequestEventEmitter,
      );

    this.usecase = new CloseUserLimitRequestUseCase(
      this.logger,
      this.userLimitRequestRepository,
      controllerUserLimitRequestEventEmitter,
    );
  }

  async execute(request: CloseUserLimitRequest): Promise<void> {
    this.logger.debug('Close user limit request.', { request });

    const { id, analysisResult } = request;

    const userLimitRequest = new UserLimitRequestEntity({
      id,
      analysisResult,
    });

    await this.usecase.execute(userLimitRequest);
  }
}
