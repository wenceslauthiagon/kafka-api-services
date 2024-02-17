import { Logger } from 'winston';
import { Type } from 'class-transformer';
import {
  IsString,
  MaxLength,
  Length,
  IsEnum,
  IsInt,
  IsPositive,
  IsArray,
  IsOptional,
  ValidateNested,
  IsObject,
  IsUUID,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  InitiationType,
  NotifyCreditValidationEntity,
  PaymentPriorityLevelType,
  NotifyCreditValidationAmountDetails,
  ValueType,
  NotifyCreditValidation,
  NotifyCreditValidationResponse,
  ResultType,
} from '@zro/api-jdpi/domain';
import {
  AccountType,
  PaymentPriorityType,
  PixAgentMod,
  PixDevolutionCode,
} from '@zro/pix-payments/domain';
import { JdpiErrorCode, JdpiFinalityType } from '@zro/jdpi/domain';
import { PersonType } from '@zro/users/domain';
import {
  PixStatementGateway,
  HandlePendingNotifyCreditValidationEventUseCase,
} from '@zro/api-jdpi/application';
import {
  NotifyCreditValidationEventEmitterController,
  NotifyCreditValidationEventEmitterControllerInterface,
} from '@zro/api-jdpi/interface';

type THandlePendingNotifyCreditAmountDetais =
  NotifyCreditValidationAmountDetails;

class HandlePendingNotifyCreditValidationAmountDetails
  extends AutoValidator
  implements THandlePendingNotifyCreditAmountDetais
{
  @IsInt()
  @IsPositive()
  fareBuyAmount: number;

  @IsEnum(ValueType)
  valueType: ValueType;
}

type THandlePendingNotifyCreditValidationResponse =
  NotifyCreditValidationResponse;

class HandlePendingNotifyCreditValidationResponse
  extends AutoValidator
  implements THandlePendingNotifyCreditValidationResponse
{
  @IsEnum(ResultType)
  resultType: ResultType;

  @IsEnum(JdpiErrorCode)
  @IsOptional()
  devolutionCode?: JdpiErrorCode;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandlePendingNotifyCreditValidationResponse) {
    super(props);
  }
}

type THandlePendingNotifyCreditValidationEventRequest = NotifyCreditValidation;

export class HandlePendingNotifyCreditValidationEventRequest
  extends AutoValidator
  implements THandlePendingNotifyCreditValidationEventRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  groupId: string;

  @IsEnum(InitiationType)
  initiationType: InitiationType;

  @IsEnum(PaymentPriorityType)
  paymentPriorityType: PaymentPriorityType;

  @IsEnum(PaymentPriorityLevelType)
  paymentPriorityLevelType: PaymentPriorityLevelType;

  @IsEnum(JdpiFinalityType)
  finalityType: JdpiFinalityType;

  @IsEnum(PixAgentMod)
  @IsOptional()
  agentModalityType?: PixAgentMod;

  @IsString()
  @IsOptional()
  ispbPss?: string;

  @IsString()
  @Length(14)
  @IsOptional()
  paymentInitiatorDocument?: string;

  @IsString()
  thirdPartIspb: string;

  @IsEnum(PersonType)
  thirdPartPersonType: PersonType;

  @IsString()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsString()
  thirdPartName: string;

  @IsString()
  @IsOptional()
  thirdPartBranch?: string;

  @IsEnum(AccountType)
  thirdPartAccountType: AccountType;

  @IsString()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsString()
  clientIspb: string;

  @IsEnum(PersonType)
  clientPersonType: PersonType;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsString()
  @IsOptional()
  clientBranch?: string;

  @IsEnum(AccountType)
  clientAccountType: AccountType;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsArray()
  @IsOptional()
  @Type(() => HandlePendingNotifyCreditValidationAmountDetails)
  @ValidateNested({ each: true })
  amountDetails?: HandlePendingNotifyCreditValidationAmountDetails[];

  @IsString()
  @IsOptional()
  informationBetweenClients?: string;

  @IsString()
  @IsOptional()
  endToEndId?: string;

  @IsString()
  @IsOptional()
  clientConciliationId?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  originalEndToEndId?: string;

  @IsString()
  @IsOptional()
  devolutionEndToEndId?: string;

  @IsEnum(PixDevolutionCode)
  @IsOptional()
  devolutionCode?: PixDevolutionCode;

  @IsString()
  @IsOptional()
  devolutionReason?: string;

  @IsObject()
  @Type(() => HandlePendingNotifyCreditValidationResponse)
  response: HandlePendingNotifyCreditValidationResponse;

  constructor(props: THandlePendingNotifyCreditValidationEventRequest) {
    super(
      Object.assign({}, props, {
        amountDetails:
          props.amountDetails &&
          props.amountDetails.map(
            (amountDetail) =>
              new HandlePendingNotifyCreditValidationAmountDetails(
                amountDetail,
              ),
          ),
      }),
    );
  }
}

export class HandlePendingNotifyCreditValidationEventController {
  private usecase: HandlePendingNotifyCreditValidationEventUseCase;

  constructor(
    private logger: Logger,
    pspGateway: PixStatementGateway,
    eventEmitter: NotifyCreditValidationEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandlePendingNotifyCreditValidationEventController.name,
    });
    const controllerEventEmitter =
      new NotifyCreditValidationEventEmitterController(eventEmitter);

    this.usecase = new HandlePendingNotifyCreditValidationEventUseCase(
      this.logger,
      pspGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandlePendingNotifyCreditValidationEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle pending notify credit validation request.', {
      request,
    });

    const notifyCreditValidation = new NotifyCreditValidationEntity(request);

    this.logger.debug('Handle pending notify credit validation finished.', {
      request,
    });

    await this.usecase.execute(notifyCreditValidation);
  }
}
