import { Logger } from 'winston';
import {
  IsString,
  IsUUID,
  IsPositive,
  IsOptional,
  IsInt,
  MaxLength,
  IsEnum,
  Length,
} from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  TranslateService,
} from '@zro/common';
import {
  FailedNotifyCreditRepository,
  NotifyCreditDevolutionEntity,
  NotifyCreditDevolutionRepository,
} from '@zro/api-jdpi/domain';
import { JdpiAccountType, JdpiPersonType } from '@zro/jdpi/domain';
import {
  HandleNotifyCreditDevolutionJdpiEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-jdpi/application';
import { Parse } from '@zro/api-jdpi/interface';

export type THandleNotifyCreditDevolutionJdpiEventRequest = {
  externalId: string;
  originalEndToEndId: string;
  devolutionEndToEndId: string;
  devolutionCode: string;
  devolutionReason?: string;
  thirdPartIspb: string;
  thirdPartPersonType: JdpiPersonType;
  thirdPartDocument: string;
  thirdPartBranch?: string;
  thirdPartAccountType: JdpiAccountType;
  thirdPartAccountNumber: string;
  thirdPartName: string;
  clientIspb: string;
  clientPersonType: JdpiPersonType;
  clientDocument: string;
  clientBranch?: string;
  clientAccountType: JdpiAccountType;
  clientAccountNumber: string;
  amount: number;
  informationBetweenClients?: string;
  createdAt: Date;
};
export class HandleNotifyCreditDevolutionJdpiEventRequest
  extends AutoValidator
  implements THandleNotifyCreditDevolutionJdpiEventRequest
{
  @IsUUID(4)
  externalId: string;

  @IsString()
  @MaxLength(255)
  originalEndToEndId: string;

  @IsString()
  @MaxLength(255)
  devolutionEndToEndId: string;

  @IsString()
  @MaxLength(4)
  devolutionCode: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  devolutionReason?: string;

  @IsString()
  @Length(8, 8)
  thirdPartIspb: string;

  @IsEnum(JdpiPersonType)
  thirdPartPersonType: JdpiPersonType;

  @IsString()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  thirdPartBranch?: string;

  @IsEnum(JdpiAccountType)
  thirdPartAccountType: JdpiAccountType;

  @IsString()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsString()
  @MaxLength(255)
  thirdPartName: string;

  @IsString()
  @Length(8, 8)
  clientIspb: string;

  @IsEnum(JdpiPersonType)
  clientPersonType: JdpiPersonType;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  clientBranch?: string;

  @IsEnum(JdpiAccountType)
  clientAccountType: JdpiAccountType;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  informationBetweenClients?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleNotifyCreditDevolutionJdpiEventRequest) {
    super(props);
  }
}

export class HandleNotifyCreditDevolutionJdpiEventController {
  /**
   * Handler triggered to create notify Credit.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyCreditRepository: NotifyCreditDevolutionRepository,
    pixPaymentService: PixPaymentService,
    failedNotifyCreditRepository: FailedNotifyCreditRepository,
    translateService: TranslateService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyCreditDevolutionJdpiEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyCreditRepository,
      pixPaymentService,
      failedNotifyCreditRepository,
      translateService,
    );
  }

  async execute(
    request: HandleNotifyCreditDevolutionJdpiEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle create credit devolution event request.', {
      request,
    });

    const notifyCreditDevolution = new NotifyCreditDevolutionEntity({
      externalId: request.externalId,
      originalEndToEndId: request.originalEndToEndId,
      devolutionEndToEndId: request.devolutionEndToEndId,
      devolutionReason: request.devolutionReason,
      devolutionCode: request.devolutionCode,
      thirdPartIspb: request.thirdPartIspb,
      thirdPartPersonType: Parse.getPersonType(request.thirdPartPersonType),
      thirdPartDocument: request.thirdPartDocument,
      ...(request.thirdPartBranch && {
        thirdPartBranch: request.thirdPartBranch,
      }),
      thirdPartAccountType: Parse.getAccountType(request.thirdPartAccountType),
      thirdPartAccountNumber: request.thirdPartAccountNumber,
      thirdPartName: request.thirdPartName,
      clientIspb: request.clientIspb,
      clientPersonType: Parse.getPersonType(request.clientPersonType),
      clientDocument: request.clientDocument,
      ...(request.clientBranch && {
        clientBranch: request.clientBranch,
      }),
      clientAccountType: Parse.getAccountType(request.clientAccountType),
      clientAccountNumber: request.clientAccountNumber,
      createdAt: request.createdAt,
      amount: request.amount,
      ...(request.informationBetweenClients && {
        informationBetweenClients: request.informationBetweenClients,
      }),
    });

    await this.usecase.execute(notifyCreditDevolution);
  }
}
