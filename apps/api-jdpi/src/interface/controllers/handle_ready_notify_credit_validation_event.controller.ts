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
  IsUUID,
  IsObject,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  InitiationType,
  NotifyCreditValidationEntity,
  NotifyCreditValidationRepository,
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
import { HandleReadyNotifyCreditValidationEventUsecase as UseCase } from '@zro/api-jdpi/application';

type THandleReadyNotifyCreditAmountDetails =
  NotifyCreditValidationAmountDetails;

class HandleReadyNotifyCreditValidationAmountDetails
  extends AutoValidator
  implements THandleReadyNotifyCreditAmountDetails
{
  @IsInt()
  @IsPositive()
  fareBuyAmount: number;

  @IsEnum(ValueType)
  valueType: ValueType;
}

type THandleReadyNotifyCreditValidationResponse =
  NotifyCreditValidationResponse;

class HandleReadyNotifyCreditValidationResponse
  extends AutoValidator
  implements THandleReadyNotifyCreditValidationResponse
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

  constructor(props: THandleReadyNotifyCreditValidationResponse) {
    super(props);
  }
}

type THandleReadyNotifyCreditValidationEventRequest = NotifyCreditValidation;

export class HandleReadyNotifyCreditValidationEventRequest
  extends AutoValidator
  implements THandleReadyNotifyCreditValidationEventRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  groupId?: string;

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
  @Type(() => HandleReadyNotifyCreditValidationAmountDetails)
  @ValidateNested({ each: true })
  amountDetails?: HandleReadyNotifyCreditValidationAmountDetails[];

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
  @Type(() => HandleReadyNotifyCreditValidationResponse)
  response: HandleReadyNotifyCreditValidationResponse;

  constructor(props: THandleReadyNotifyCreditValidationEventRequest) {
    super(
      Object.assign({}, props, {
        amountDetails:
          props.amountDetails &&
          props.amountDetails.map(
            (amountDetail) =>
              new HandleReadyNotifyCreditValidationAmountDetails(amountDetail),
          ),
      }),
    );
  }
}

type THandleReadyNotifyCreditValidationEventResponse = {
  id: string;
  createdAt: Date;
};

export class HandleReadyNotifyCreditValidationEventResponse
  extends AutoValidator
  implements THandleReadyNotifyCreditValidationEventResponse
{
  @IsUUID()
  id: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleReadyNotifyCreditValidationEventResponse) {
    super(props);
  }
}

export class HandleReadyNotifyCreditValidationEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    notifyCreditValidationRepository: NotifyCreditValidationRepository,
  ) {
    this.logger = logger.child({
      context: HandleReadyNotifyCreditValidationEventController.name,
    });

    this.usecase = new UseCase(this.logger, notifyCreditValidationRepository);
  }

  async execute(
    request: HandleReadyNotifyCreditValidationEventRequest,
  ): Promise<HandleReadyNotifyCreditValidationEventResponse> {
    this.logger.debug('Handle ready notify credit validation request.', {
      request,
    });

    const notifyCreditValidation = new NotifyCreditValidationEntity(request);

    const result = await this.usecase.execute(notifyCreditValidation);

    const response = new HandleReadyNotifyCreditValidationEventResponse({
      id: result.id,
      createdAt: result.createdAt,
    });

    return response;
  }
}
