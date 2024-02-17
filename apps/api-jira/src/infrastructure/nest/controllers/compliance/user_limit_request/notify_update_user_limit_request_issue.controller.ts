import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  Body,
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
import { IsNumber, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { LoggerParam, RequestId } from '@zro/common';
import {
  UserLimitRequestAnalysisResultType,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import { NotifyUserLimitRequestIssueEntity } from '@zro/api-jira/domain';
import {
  updateUserLimitRequestIssueBodyRest,
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
type StatusType = { id: string; name: UserLimitRequestStatus };
type AssigneeType = { displayName: string };
type CreatorType = { displayName: string };
type ReporterType = { displayName: string };

export class NotifyUserLimitRequestUpdateParams {
  @ApiProperty({
    description: 'ID for issue created in Jira.',
    example: '1234',
  })
  @IsNumber()
  @Transform((params) => params && parseInt(params.value))
  issue_id: number;
}

export class NotifyUserLimitRequestUpdateBody {
  @ApiProperty(updateUserLimitRequestIssueBodyRest)
  @IsObject()
  issue: Issue;
}

interface JiraCustomFieldConfig {
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_USER_LIMIT_REQUEST_ID: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_RESOLUTION: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_RESOLUTION_APPROVED: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_RESOLUTION_REJECTED: string;
  APP_JIRA_USER_LIMIT_REQUEST_STATUS_CLOSED: string;
}

/**
 * Notify cancel issue controller.
 */
@ApiBearerAuth()
@ApiTags('Issues | User limit request')
@Controller('notify/user-limit-request/updated/:issue_id')
export class NotifyUpdateUserLimitRequestIssueRestController {
  private appJiraCustomFieldUserLimitRequestUserLimitRequestId: string;
  private appJiraCustomFieldUserLimitRequestResolution: string;
  private appJiraCustomFieldUserLimitRequestResolutionApproved: string;
  private appJiraCustomFieldUserLimitRequestResolutionRejected: string;
  private appJiraUserLimitRequestStatusClosed: string;

  constructor(
    private readonly service: JiraServiceKafka,
    private configService: ConfigService<JiraCustomFieldConfig>,
  ) {
    this.appJiraCustomFieldUserLimitRequestUserLimitRequestId =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_USER_LIMIT_REQUEST_ID',
      );

    this.appJiraCustomFieldUserLimitRequestResolution =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_RESOLUTION',
      );

    this.appJiraCustomFieldUserLimitRequestResolutionApproved =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_RESOLUTION_APPROVED',
      );

    this.appJiraCustomFieldUserLimitRequestResolutionRejected =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_RESOLUTION_REJECTED',
      );
    this.appJiraUserLimitRequestStatusClosed = this.configService.get<string>(
      'APP_JIRA_USER_LIMIT_REQUEST_STATUS_CLOSED',
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
    @Body() data: NotifyUserLimitRequestUpdateBody,
    @Param() params: NotifyUserLimitRequestUpdateParams,
    @RequestId() requestId: string,
    @LoggerParam(NotifyUpdateUserLimitRequestIssueRestController)
    logger: Logger,
  ): Promise<void> {
    const analysisResultMapper = {
      [this.appJiraCustomFieldUserLimitRequestResolutionApproved]:
        UserLimitRequestAnalysisResultType.APPROVED,
      [this.appJiraCustomFieldUserLimitRequestResolutionRejected]:
        UserLimitRequestAnalysisResultType.REJECTED,
    };

    const statusMapper = {
      [this.appJiraUserLimitRequestStatusClosed]: UserLimitRequestStatus.CLOSED,
    };

    // Update a payload.
    const payload = new NotifyUserLimitRequestIssueEntity({
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
      userLimitRequestId:
        data.issue?.fields[
          this.appJiraCustomFieldUserLimitRequestUserLimitRequestId
        ],
      analysisResult:
        analysisResultMapper[
          data.issue?.fields[this.appJiraCustomFieldUserLimitRequestResolution]
            ?.id
        ],
      assigneeName: data.issue?.fields?.assignee?.displayName,
      creatorName: data.issue?.fields?.creator?.displayName,
      reporterName: data.issue?.fields?.reporter?.displayName,
      issueCreatedAt: data.issue?.fields?.updated,
    });

    logger.debug('Notify close user limit request issue in jira.', {
      issue_id: params.issue_id,
    });

    // Call api jira service.
    await this.service.notifyUpdateUserLimitRequestIssue(requestId, payload);

    logger.debug('User limit request issue updated.', { payload });
  }
}
