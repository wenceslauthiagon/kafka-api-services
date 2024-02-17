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
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  NotifyCreditDevolutionEntity,
  NotifyCreditDevolutionRepository,
} from '@zro/api-jdpi/domain';
import { JdpiAccountType, JdpiPersonType } from '@zro/jdpi/domain';
import { HandleFailedNotifyCreditDevolutionJdpiEventUseCase as UseCase } from '@zro/api-jdpi/application';
import {
  NotifyCreditDevolutionEventEmitterController,
  NotifyCreditDevolutionEventEmitterControllerInterface,
  Parse,
} from '@zro/api-jdpi/interface';

export type THandleFailedNotifyCreditDevolutionJdpiEventRequest = {
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
  createdAt: Date;
  amount: number;
  informationBetweenClients?: string;
};

export class HandleFailedNotifyCreditDevolutionJdpiEventRequest
  extends AutoValidator
  implements THandleFailedNotifyCreditDevolutionJdpiEventRequest
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

  constructor(props: THandleFailedNotifyCreditDevolutionJdpiEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyCreditDevolutionJdpiEventController {
  /**
   * Handler triggered to create failed notify credit devolution.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyCreditDevolutionRepository: NotifyCreditDevolutionRepository,
    eventEmitter: NotifyCreditDevolutionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCreditDevolutionJdpiEventController.name,
    });

    const controllerEventEmitter =
      new NotifyCreditDevolutionEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyCreditDevolutionRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyCreditDevolutionJdpiEventRequest,
  ): Promise<void> {
    this.logger.debug(
      'Handle create failed notify credit devolution request.',
      { request },
    );

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
