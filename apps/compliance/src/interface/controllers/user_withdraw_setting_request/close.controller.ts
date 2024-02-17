import { Logger } from 'winston';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
} from '@zro/compliance/domain';
import { AutoValidator } from '@zro/common';
import { IsUUID, IsEnum, IsDate } from 'class-validator';
import {
  CloseUserWithdrawSettingRequestUseCase,
  UtilService,
} from '@zro/compliance/application';
import {
  UserWithdrawSettingRequestEventEmitterController,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';

type TCloseUserWithdrawSettingRequest = Pick<
  UserWithdrawSettingRequest,
  'id' | 'analysisResult'
>;

export class CloseUserWithdrawSettingRequest
  extends AutoValidator
  implements TCloseUserWithdrawSettingRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(UserWithdrawSettingRequestAnalysisResultType)
  analysisResult: UserWithdrawSettingRequestAnalysisResultType;

  constructor(props: TCloseUserWithdrawSettingRequest) {
    super(props);
  }
}

type TCloseUserWithdrawSettingResponse = Pick<
  UserWithdrawSettingRequest,
  'id' | 'analysisResult' | 'closedAt'
>;

export class CloseUserWithdrawSettingResponse
  extends AutoValidator
  implements TCloseUserWithdrawSettingResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(UserWithdrawSettingRequestAnalysisResultType)
  analysisResult: UserWithdrawSettingRequestAnalysisResultType;

  @IsDate()
  closedAt: Date;

  constructor(props: TCloseUserWithdrawSettingResponse) {
    super(props);
  }
}

export class CloseUserWithdrawSettingRequestController {
  private usecase: CloseUserWithdrawSettingRequestUseCase;

  constructor(
    private logger: Logger,
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    eventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface,
    utilService: UtilService,
  ) {
    this.logger = logger.child({
      context: CloseUserWithdrawSettingRequestController.name,
    });

    const controllerUserWithdrawSettingRequestEventEmitter =
      new UserWithdrawSettingRequestEventEmitterController(eventEmitter);

    this.usecase = new CloseUserWithdrawSettingRequestUseCase(
      this.logger,
      userWithdrawSettingRequestRepository,
      controllerUserWithdrawSettingRequestEventEmitter,
      utilService,
    );
  }

  async execute(
    request: CloseUserWithdrawSettingRequest,
  ): Promise<CloseUserWithdrawSettingResponse> {
    this.logger.debug('Close user withdraw setting request.', { request });

    const { id, analysisResult } = request;

    const userWithdrawSettingRequest = new UserWithdrawSettingRequestEntity({
      id,
      analysisResult,
    });

    const result = await this.usecase.execute(userWithdrawSettingRequest);

    const response = new CloseUserWithdrawSettingResponse({
      id: result.id,
      analysisResult: result.analysisResult,
      closedAt: result.closedAt,
    });

    this.logger.debug('Close user withdraw setting response.', { response });

    return response;
  }
}
