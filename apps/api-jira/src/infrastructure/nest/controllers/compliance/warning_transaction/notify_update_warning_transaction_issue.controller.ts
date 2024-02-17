import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  Body,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { Transform } from 'class-transformer';
import { IsNumber, IsObject } from 'class-validator';
import {
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { LoggerParam, RequestId } from '@zro/common';
import { NotifyWarningTransactionIssueEntity } from '@zro/api-jira/domain';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  updateWarningTransactionIssueBodyRest,
  JiraServiceKafka,
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
type StatusType = { id: string; name: WarningTransactionStatus };
type AssigneeType = { displayName: string };
type CreatorType = { displayName: string };
type ReporterType = { displayName: string };

export class NotifyWarningTransactionUpdateParams {
  @ApiProperty({
    description: 'ID for issue created in Jira.',
    example: '1234',
  })
  @IsNumber()
  @Transform((params) => params && parseInt(params.value))
  issue_id: number;
}

export class NotifyWarningTransactionUpdateBody {
  @ApiProperty(updateWarningTransactionIssueBodyRest)
  @IsObject()
  issue: Issue;
}

interface JiraCustomFieldConfig {
  APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_RESOLUTION: string;
  APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_RESOLUTION_APPROVED: string;
  APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_RESOLUTION_REJECTED: string;
  APP_JIRA_WARNING_TRANSACTION_STATUS_CLOSED: string;
  APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_OPERATION_ID: string;
  APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_REPLY_MESSAGE: string;
}

/**
 * Notify update issue controller.
 */
@ApiBearerAuth()
@ApiTags('Issues | Warning Transaction')
@Controller('notify/warning-transaction/updated/:issue_id')
export class NotifyUpdateWarningTransactionIssueRestController {
  private appJiraCustomFieldWarningTransactionResolution: string;
  private appJiraCustomFieldWarningTransactionResolutionApproved: string;
  private appJiraCustomFieldWarningTransactionResolutionRejected: string;
  private appJiraWarningTransactionStatusClosed: string;
  private appJiraCustomFieldOperationId: string;
  private appJiraCustomFieldReplyMessage: string;

  constructor(
    private readonly service: JiraServiceKafka,
    private configService: ConfigService<JiraCustomFieldConfig>,
  ) {
    this.appJiraCustomFieldWarningTransactionResolution =
      this.configService.get<string>(
        'APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_RESOLUTION',
      );

    this.appJiraCustomFieldWarningTransactionResolutionApproved =
      this.configService.get<string>(
        'APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_RESOLUTION_APPROVED',
      );

    this.appJiraCustomFieldWarningTransactionResolutionRejected =
      this.configService.get<string>(
        'APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_RESOLUTION_REJECTED',
      );
    this.appJiraWarningTransactionStatusClosed = this.configService.get<string>(
      'APP_JIRA_WARNING_TRANSACTION_STATUS_CLOSED',
    );
    this.appJiraCustomFieldOperationId = this.configService.get<string>(
      'APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_OPERATION_ID',
    );
    this.appJiraCustomFieldReplyMessage = this.configService.get<string>(
      'APP_JIRA_WARNING_TRANSACTION_CUSTOM_FIELD_REPLY_MESSAGE',
    );
  }

  /**
   * Notify close endpoint.
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
    @Body() data: NotifyWarningTransactionUpdateBody,
    @Param() params: NotifyWarningTransactionUpdateParams,
    @RequestId() requestId: string,
    @LoggerParam(NotifyUpdateWarningTransactionIssueRestController)
    logger: Logger,
  ): Promise<void> {
    const analysisResultMapper = {
      [this.appJiraCustomFieldWarningTransactionResolutionApproved]:
        WarningTransactionAnalysisResultType.APPROVED,
      [this.appJiraCustomFieldWarningTransactionResolutionRejected]:
        WarningTransactionAnalysisResultType.REJECTED,
    };

    const statusMapper = {
      [this.appJiraWarningTransactionStatusClosed]:
        WarningTransactionStatus.CLOSED,
    };

    // Update a payload.
    const payload = new NotifyWarningTransactionIssueEntity({
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
      summary: data.issue?.fields?.summary,
      operationId: data.issue?.fields?.[this.appJiraCustomFieldOperationId],
      analysisResult:
        analysisResultMapper[
          data.issue?.fields[
            this.appJiraCustomFieldWarningTransactionResolution
          ]?.id
        ],
      analysisDetails:
        data.issue?.fields?.[this.appJiraCustomFieldReplyMessage],
      assigneeName: data.issue?.fields?.assignee?.displayName,
      creatorName: data.issue?.fields?.creator?.displayName,
      reporterName: data.issue?.fields?.reporter?.displayName,
      issueCreatedAt: data.issue?.fields?.updated,
    });

    logger.debug('Notify close warning transaction issue in jira.', {
      issue_id: params.issue_id,
    });

    // Call api jira service.
    await this.service.notifyUpdateWarningTransactionIssue(requestId, payload);

    logger.debug('Warning transaction request issue updated.', { payload });
  }
}
