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
import { NotifyPixInfractionIssueEntity } from '@zro/api-jira/domain';
import {
  PixInfractionAnalysisResultType,
  PixInfractionStatus,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import {
  JiraServiceKafka,
  updatePixInfractionIssueBodyRest,
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
type StatusType = { id: string; name: PixInfractionStatus };
type AssigneeType = { displayName: string };
type CreatorType = { displayName: string };
type ReporterType = { displayName: string };

export class NotifyPixInfractionUpdateBody {
  @ApiProperty(updatePixInfractionIssueBodyRest)
  @IsObject()
  issue: Issue;
}

export class NotifyPixInfractionUpdateParams {
  @ApiProperty({
    description: 'ID for issue updated in Jira.',
    example: '1234',
  })
  @IsNumber()
  @Transform((params) => params && parseInt(params.value))
  issue_id: number;
}

interface JiraCustomFieldConfig {
  APP_JIRA_INFRACTION_CUSTOM_FIELD_OPERATION_ID: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_DETAILS: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_AGREE: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_DISAGREE: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_FRAUD: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_REQUEST_REFUND: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_CANCEL_DEVOLUTION: string;
  APP_JIRA_INFRACTION_STATUS_CLOSED: string;
  APP_JIRA_INFRACTION_STATUS_CANCELLED: string;
  APP_JIRA_INFRACTION_STATUS_OPENED: string;
  APP_JIRA_INFRACTION_STATUS_IN_ANALYSIS: string;
}

/**
 * Notify update issue controller.
 */
@ApiBearerAuth()
@ApiTags('Issues | Pix Infraction')
@Controller('notify/infraction/updated/:issue_id')
export class NotifyUpdatePixInfractionIssueRestController {
  private appJiraCustomFieldOperationId: string;
  private appJiraCustomFieldResolution: string;
  private appJiraCustomFieldResolutionDetails: string;
  private appJiraCustomFieldResolutionAgree: string;
  private appJiraCustomFieldResolutionDisagree: string;
  private appJiraCustomFieldReason: string;
  private appJiraCustomFieldReasonFraud: string;
  private appJiraCustomFieldReasonRequestRefund: string;
  private appJiraCustomFieldReasonCancelDevolution: string;
  private appJiraInfractionStatusClosed: string;
  private appJiraInfractionStatusCancelled: string;
  private appJiraInfractionStatusOpened: string;
  private appJiraInfractionStatusInAnalysis: string;

  /**
   * Default constructor.
   * @param service jira service.
   */
  constructor(
    private readonly service: JiraServiceKafka,
    private configService: ConfigService<JiraCustomFieldConfig>,
  ) {
    this.appJiraCustomFieldOperationId = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_OPERATION_ID',
    );
    this.appJiraCustomFieldResolution = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION',
    );
    this.appJiraCustomFieldResolutionDetails = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_DETAILS',
    );
    this.appJiraCustomFieldResolutionAgree = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_AGREE',
    );
    this.appJiraCustomFieldResolutionDisagree = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_DISAGREE',
    );
    this.appJiraCustomFieldReason = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON',
    );
    this.appJiraCustomFieldReasonFraud = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_FRAUD',
    );
    this.appJiraCustomFieldReasonRequestRefund = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_REQUEST_REFUND',
    );
    this.appJiraCustomFieldReasonCancelDevolution =
      this.configService.get<string>(
        'APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_CANCEL_DEVOLUTION',
      );
    this.appJiraInfractionStatusClosed = this.configService.get<string>(
      'APP_JIRA_INFRACTION_STATUS_CLOSED',
    );
    this.appJiraInfractionStatusCancelled = this.configService.get<string>(
      'APP_JIRA_INFRACTION_STATUS_CANCELLED',
    );
    this.appJiraInfractionStatusOpened = this.configService.get<string>(
      'APP_JIRA_INFRACTION_STATUS_OPENED',
    );
    this.appJiraInfractionStatusInAnalysis = this.configService.get<string>(
      'APP_JIRA_INFRACTION_STATUS_IN_ANALYSIS',
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
    @Body() data: NotifyPixInfractionUpdateBody,
    @Param() params: NotifyPixInfractionUpdateParams,
    @RequestId() requestId: string,
    @LoggerParam(NotifyUpdatePixInfractionIssueRestController)
    logger: Logger,
  ): Promise<void> {
    const analysisResultMapper = {
      [this.appJiraCustomFieldResolutionAgree]:
        PixInfractionAnalysisResultType.AGREED,
      [this.appJiraCustomFieldResolutionDisagree]:
        PixInfractionAnalysisResultType.DISAGREED,
    };

    const infractionTypeMapper = {
      [this.appJiraCustomFieldReasonRequestRefund]:
        PixInfractionType.REFUND_REQUEST,
      [this.appJiraCustomFieldReasonFraud]: PixInfractionType.FRAUD,
      [this.appJiraCustomFieldReasonCancelDevolution]:
        PixInfractionType.CANCEL_DEVOLUTION,
    };

    const statusMapper = {
      [this.appJiraInfractionStatusClosed]: PixInfractionStatus.CLOSED,
      [this.appJiraInfractionStatusCancelled]: PixInfractionStatus.CANCELLED,
      [this.appJiraInfractionStatusOpened]: PixInfractionStatus.OPENED,
      [this.appJiraInfractionStatusInAnalysis]: PixInfractionStatus.IN_ANALYSIS,
    };

    // Update a payload.
    const payload = new NotifyPixInfractionIssueEntity({
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
      infractionType:
        infractionTypeMapper[
          data.issue?.fields[this.appJiraCustomFieldReason]?.id
        ],
      summary: data.issue?.fields?.summary,
      assigneeName: data.issue?.fields?.assignee?.displayName,
      creatorName: data.issue?.fields?.creator?.displayName,
      reporterName: data.issue?.fields?.reporter?.displayName,
      issueCreatedAt: data.issue?.fields?.updated,
      analysisResult:
        analysisResultMapper[
          data.issue?.fields[this.appJiraCustomFieldResolution]?.id
        ],
      analysisDetails:
        data.issue?.fields[this.appJiraCustomFieldResolutionDetails],
    });

    logger.debug('Notify update issue in jira.', {
      issue_id: params.issue_id,
    });

    // Call api jira service.
    await this.service.notifyUpdatePixInfractionIssue(requestId, payload);

    logger.debug('Issue updated.', { payload });
  }
}
