import {
  Controller,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { IsObject, IsNumber } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { LoggerParam, RequestId } from '@zro/common';
import { NotifyPixRefundIssueEntity } from '@zro/api-jira/domain';
import {
  PixRefundReason,
  PixRefundRejectionReason,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  JiraServiceKafka,
  updatePixRefundIssueBodyRest,
} from '@zro/api-jira/infrastructure';

type Issue = {
  fields: FieldType;
};

type FieldType = {
  issuetype: IssueType;
  project: ProjectType;
  updated: Date;
  priority: PriorityType;
  status: StatusType;
  description: string;
  summary: string;
  assignee: AssigneeType;
  creator: CreatorType;
  reporter: ReporterType;
};

type IssueType = {
  id: string;
  name: string;
};

type ProjectType = {
  id: string;
  key: string;
  name: string;
};

type PriorityType = { id: string; name: string };
type StatusType = { id: string; name: PixRefundStatus };
type AssigneeType = { displayName: string };
type CreatorType = { displayName: string };
type ReporterType = { displayName: string };

export class NotifyPixRefundUpdateBody {
  @ApiProperty(updatePixRefundIssueBodyRest)
  @IsObject()
  issue: Issue;
}

export class NotifyPixRefundUpdateParams {
  @ApiProperty({
    description: 'ID for issue updated in Jira.',
    example: '1234',
  })
  @IsNumber()
  @Transform((params) => params && parseInt(params.value))
  issue_id: number;
}

interface JiraCustomFieldConfig {
  APP_JIRA_REFUND_CUSTOM_FIELD_OPERATION_ID: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_DETAILS: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_ACCOUNT_CLOSURE: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_CANNOT_REFUND: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_NO_BALANCE: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_OTHER: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_FRAUD_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_OPERATION_FLAW_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_CANCELLED_REASON: string;
  APP_JIRA_REFUND_STATUS_CLOSED: string;
  APP_JIRA_REFUND_STATUS_CANCELLED: string;
}

/**
 * Notify update issue controller.
 */
@ApiBearerAuth()
@ApiTags('Issues | Pix Refund')
@Controller('notify/refund/updated/:issue_id')
export class NotifyUpdatePixRefundIssueRestController {
  private appJiraCustomFieldOperationId: string;
  private appJiraCustomFieldResolution: string;
  private appJiraCustomFieldResolutionDetails: string;
  private appJiraCustomFieldResolutionAccountClosure: string;
  private appJiraCustomFieldResolutionCannotRefund: string;
  private appJiraCustomFieldResolutionNoBalance: string;
  private appJiraCustomFieldResolutionOther: string;
  private appJiraCustomFieldReason: string;
  private appJiraCustomFieldReasonFraud: string;
  private appJiraCustomFieldOperationalFlow: string;
  private appJiraCustomFieldReasonRefundCancelled: string;
  private appJiraRefundStatusClosed: string;
  private appJiraRefundStatusCancelled: string;

  /**
   * Default constructor.
   * @param service jira service.
   */
  constructor(
    private readonly service: JiraServiceKafka,
    private readonly configService: ConfigService<JiraCustomFieldConfig>,
  ) {
    this.appJiraCustomFieldOperationId = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_OPERATION_ID',
    );
    this.appJiraCustomFieldResolution = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION',
    );
    this.appJiraCustomFieldResolutionDetails = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_DETAILS',
    );
    this.appJiraCustomFieldResolutionAccountClosure =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_ACCOUNT_CLOSURE',
      );
    this.appJiraCustomFieldResolutionCannotRefund =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_CANNOT_REFUND',
      );
    this.appJiraCustomFieldResolutionNoBalance = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_NO_BALANCE',
    );
    this.appJiraCustomFieldResolutionOther = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_RESOLUTION_OTHER',
    );
    this.appJiraCustomFieldReason = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_REASON',
    );
    this.appJiraCustomFieldReasonFraud = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_FRAUD_REASON',
    );
    this.appJiraCustomFieldOperationalFlow = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_OPERATION_FLAW_REASON',
    );
    this.appJiraCustomFieldReasonRefundCancelled =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_CANCELLED_REASON',
      );
    this.appJiraRefundStatusClosed = this.configService.get<string>(
      'APP_JIRA_REFUND_STATUS_CLOSED',
    );
    this.appJiraRefundStatusCancelled = this.configService.get<string>(
      'APP_JIRA_REFUND_STATUS_CANCELLED',
    );
  }

  /**
   * NotifyUpdate endpoint.
   */
  @ApiOperation({
    description: 'Notify update.',
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
    @Body() data: NotifyPixRefundUpdateBody,
    @Param() params: NotifyPixRefundUpdateParams,
    @RequestId() requestId: string,
    @LoggerParam(NotifyUpdatePixRefundIssueRestController)
    logger: Logger,
  ): Promise<void> {
    const rejectionMapper = {
      [this.appJiraCustomFieldResolutionAccountClosure]:
        PixRefundRejectionReason.ACCOUNT_CLOSURE,
      [this.appJiraCustomFieldResolutionCannotRefund]:
        PixRefundRejectionReason.CANNOT_REFUND,
      [this.appJiraCustomFieldResolutionNoBalance]:
        PixRefundRejectionReason.NO_BALANCE,
      [this.appJiraCustomFieldResolutionOther]: PixRefundRejectionReason.OTHER,
    };

    const reasonMapper = {
      [this.appJiraCustomFieldReasonFraud]: PixRefundReason.FRAUD,
      [this.appJiraCustomFieldOperationalFlow]:
        PixRefundReason.OPERATIONAL_FLAW,
      [this.appJiraCustomFieldReasonRefundCancelled]:
        PixRefundReason.REFUND_CANCELLED,
    };

    const statusMapper = {
      [this.appJiraRefundStatusClosed]: PixRefundStatus.CLOSED,
      [this.appJiraRefundStatusCancelled]: PixRefundStatus.CANCELLED,
    };

    // Update a payload.
    const payload = new NotifyPixRefundIssueEntity({
      issueId: params.issue_id,
      issueTypeId:
        data.issue?.fields?.issuetype?.id &&
        parseInt(data.issue?.fields?.issuetype?.id),
      issueTypeName: data.issue?.fields?.issuetype?.name,
      projectId:
        data.issue?.fields?.project?.id &&
        parseInt(data.issue?.fields?.project?.id),
      projectKey: data.issue?.fields?.project?.key,
      projectName: data.issue?.fields?.project?.name,
      priorityId:
        data.issue?.fields?.priority?.id &&
        parseInt(data.issue?.fields?.priority?.id),
      priorityName: data.issue?.fields?.priority?.name,
      statusId:
        data.issue?.fields?.status?.id &&
        parseInt(data.issue?.fields?.status?.id),
      status: statusMapper[data.issue?.fields?.status?.id],
      operationId: data.issue?.fields[this.appJiraCustomFieldOperationId],
      description: data.issue?.fields?.description,
      reason:
        reasonMapper[data.issue?.fields[this.appJiraCustomFieldReason]?.id],
      summary: data.issue?.fields?.summary,
      assigneeName: data.issue?.fields?.assignee?.displayName,
      creatorName: data.issue?.fields?.creator?.displayName,
      reporterName: data.issue?.fields?.reporter?.displayName,
      issueCreatedAt: data.issue?.fields?.updated,
      rejectionReason:
        rejectionMapper[
          data.issue?.fields[this.appJiraCustomFieldResolution]?.id
        ],
      analysisDetails:
        data.issue?.fields[this.appJiraCustomFieldResolutionDetails],
    });

    logger.debug('Notify update issue in jira.', {
      issue_id: params.issue_id,
    });

    // Call api jira service.
    await this.service.notifyUpdatePixRefundIssue(requestId, payload);

    logger.debug('Issue updated.', { payload });
  }
}
