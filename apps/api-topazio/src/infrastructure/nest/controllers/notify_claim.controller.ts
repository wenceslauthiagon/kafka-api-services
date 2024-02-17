import { Controller, Body, Post, HttpStatus, HttpCode } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { Transform } from 'class-transformer';
import {
  ApiProperty,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { formatBranch, formatIspb, InjectLogger, RequestId } from '@zro/common';
import {
  KeyType,
  ClaimReasonType,
  ClaimStatusType,
  ClaimType,
} from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { TopazioServiceKafka } from '@zro/api-topazio/infrastructure';
import { HandleNotifyClaimTopazioEventRequest } from '@zro/api-topazio/interface';

class NotifyClaimItem {
  @ApiProperty({
    description: 'Request id.',
    example: 'bdb98227-3e02-4fa2-8e71-bfb8e4b4310a',
  })
  requestId!: string;

  @ApiProperty({
    description: 'Account opening date.',
    example: '2020-10-09T22:33:00.000Z',
  })
  accountOpeningDate!: Date;

  @ApiProperty({
    description: 'Account type.',
    example: AccountType.CACC,
  })
  accountType!: AccountType;

  @ApiProperty({
    description: 'Branch.',
    example: '0001',
  })
  @Transform((params) => formatBranch(params.value))
  branch!: string;

  @ApiProperty({
    description: 'Account number.',
    example: '359751',
  })
  accountNumber!: string;

  @ApiProperty({
    description: 'Claim reason.',
    enum: ClaimReasonType,
    example: ClaimReasonType.DEFAULT_OPERATION,
  })
  claimReason!: ClaimReasonType;

  @ApiProperty({
    description: 'Claim type.',
    enum: ClaimType,
    example: ClaimType.PORTABILITY,
  })
  claimType!: ClaimType;

  @ApiProperty({
    description: 'Person’s document number.',
    example: '01928340291',
  })
  document!: string;

  @ApiProperty({
    description: 'Is a key donation.',
    example: false,
  })
  donation!: boolean;

  @ApiProperty({
    description: 'ISPB Number.',
    example: '12321342',
  })
  @Transform((params) => formatIspb(params.value))
  donorIspb!: string;

  @ApiProperty({
    description: 'ISPB Number.',
    example: '12321342',
  })
  @Transform((params) => formatIspb(params.value))
  requestIspb!: string;

  @ApiProperty({
    description: 'End Complete date.',
    example: '2020-09-09T00:00:00.000Z',
  })
  endCompleteDate!: Date;

  @ApiProperty({
    description: 'End resolution date.',
    example: '2020-09-09T00:00:00.000Z',
  })
  endResolutionDate!: Date;

  @ApiProperty({
    description: 'Last change date.',
    example: '2020-09-09T00:00:00.000Z',
  })
  lastChangeDate!: Date;

  @ApiProperty({
    description: 'ISPB Number.',
    example: '12321342',
  })
  @Transform((params) => formatIspb(params.value))
  ispb!: string;

  @ApiProperty({
    description: 'Client key.',
    example: 'bdb98227-3e02-4fa2-8e71-bfb8e4b4310a',
  })
  key!: string;

  @ApiProperty({
    description: 'Type of the key.',
    enum: KeyType,
    example: KeyType.EVP,
  })
  keyType!: KeyType;

  @ApiProperty({
    description: "Person's name.",
  })
  name!: string;

  @ApiProperty({
    description: 'Type of person.',
    enum: PersonType,
    example: PersonType.LEGAL_PERSON,
  })
  personType!: PersonType;

  @ApiProperty({
    description: 'Claim status.',
    enum: ClaimStatusType,
    example: ClaimStatusType.COMPLETED,
  })
  status!: ClaimStatusType;

  @ApiProperty({
    description:
      "Company's trade name. Allowed only when personType is 'LEGAL_PERSON'.",
  })
  tradeName!: string;
}

export class NotifyClaimsBody {
  @ApiProperty({
    description: 'The claims notifications.',
    type: [NotifyClaimItem],
  })
  claims!: NotifyClaimItem[];
}

/**
 * Notify claims controller.
 */
@ApiBearerAuth()
@ApiTags('Pix | Keys')
@Controller('notify-claims')
export class NotifyClaimsRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param service notifyClaim topazio service.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly service: TopazioServiceKafka,
  ) {
    this.logger = logger.child({ context: NotifyClaimsRestController.name });
  }

  /**
   * Create notifyCredit endpoint.
   */
  @ApiOperation({
    description: 'Notify claims.',
  })
  @ApiOkResponse({
    description: 'Notification successfully received.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @Body() data: NotifyClaimsBody,
    @RequestId() requestId: string,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    for (const claim of data?.claims) {
      // Create a payload.
      const payload = new HandleNotifyClaimTopazioEventRequest({
        id: uuidV4(),
        externalId: claim.requestId,
        accountOpeningDate: claim.accountOpeningDate,
        accountType: claim.accountType,
        branch: claim.branch.padStart(4, '0'),
        accountNumber: claim.accountNumber,
        claimReason: claim.claimReason,
        claimType: claim.claimType,
        document: claim.document,
        donation: claim.donation,
        donorIspb: claim.donorIspb,
        requestIspb: claim.requestIspb,
        endCompleteDate: claim.endCompleteDate,
        endResolutionDate: claim.endResolutionDate,
        lastChangeDate: claim.lastChangeDate,
        ispb: claim.ispb,
        key: claim.key,
        keyType: claim.keyType,
        name: claim.name,
        personType: claim.personType,
        status: claim.status,
        tradeName: claim.tradeName,
      });

      logger.debug('Notify claims in topazio.', { payload });

      // Call create pixKey service.
      await this.service.notifyClaims(requestId, payload);

      logger.debug('Notify created and event emmited.');
    }
  }
}
