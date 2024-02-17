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
import { IsObject, IsString, Length } from 'class-validator';
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
import { NotifyUserWithdrawSettingRequestIssueEntity } from '@zro/api-jira/domain';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import {
  updateUserWithdrawSettingRequestIssueBodyRest,
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
type StatusType = { id: string; name: UserWithdrawSettingRequestState };
type AssigneeType = { displayName: string };
type CreatorType = { displayName: string };
type ReporterType = { displayName: string };

export class NotifyUserWithdrawSettingRequestUpdateParams {
  @ApiProperty({
    description: 'ID for issue created in Jira.',
    example: '1234',
  })
  @IsString()
  @Length(1, 255)
  issue_id: string;
}

export class NotifyUserWithdrawSettingRequestUpdateBody {
  @ApiProperty(updateUserWithdrawSettingRequestIssueBodyRest)
  @IsObject()
  issue: Issue;
}

interface JiraCustomFieldConfig {
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_CUSTOM_FIELD_RESOLUTION: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_CUSTOM_FIELD_RESOLUTION_APPROVED: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_CUSTOM_FIELD_RESOLUTION_REJECTED: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_STATUS_CLOSED: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_CUSTOM_FIELD_USER_WITHDRAW_SETTING_REQUEST_ID: string;
}

/**
 * Notify update issue controller.
 */
@ApiBearerAuth()
@ApiTags('Issues | User withdraw setting request')
@Controller('notify/user-withdraw-setting-request/updated/:issue_id')
export class NotifyUpdateUserWithdrawSettingRequestIssueRestController {
  private appJiraCustomFieldUserWithdrawSettingRequestResolution: string;
  private appJiraCustomFieldUserWithdrawSettingRequestResolutionApproved: string;
  private appJiraCustomFieldUserWithdrawSettingRequestResolutionRejected: string;
  private appJiraUserWithdrawSettingRequestStatusClosed: string;
  private appJiraCustomFieldUserWithdrawSettingRequestId: string;

  constructor(
    private readonly service: JiraServiceKafka,
    private configService: ConfigService<JiraCustomFieldConfig>,
  ) {
    this.appJiraCustomFieldUserWithdrawSettingRequestResolution =
      this.configService.get<string>(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_CUSTOM_FIELD_RESOLUTION',
      );

    this.appJiraCustomFieldUserWithdrawSettingRequestResolutionApproved =
      this.configService.get<string>(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_CUSTOM_FIELD_RESOLUTION_APPROVED',
      );

    this.appJiraCustomFieldUserWithdrawSettingRequestResolutionRejected =
      this.configService.get<string>(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_CUSTOM_FIELD_RESOLUTION_REJECTED',
      );

    this.appJiraUserWithdrawSettingRequestStatusClosed =
      this.configService.get<string>(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_STATUS_CLOSED',
      );
    this.appJiraCustomFieldUserWithdrawSettingRequestId =
      this.configService.get<string>(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_CUSTOM_FIELD_USER_WITHDRAW_SETTING_REQUEST_ID',
      );
  }

  /**
   * Notify update endpoint.
   */
  @ApiOperation({
    description: 'Notify update.',
  })
  @ApiOkResponse({
    description: 'Notification update successfully received.',
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
    @Body() data: NotifyUserWithdrawSettingRequestUpdateBody,
    @Param() params: NotifyUserWithdrawSettingRequestUpdateParams,
    @RequestId() requestId: string,
    @LoggerParam(NotifyUpdateUserWithdrawSettingRequestIssueRestController)
    logger: Logger,
  ): Promise<void> {
    const analysisResultMapper = {
      [this.appJiraCustomFieldUserWithdrawSettingRequestResolutionApproved]:
        UserWithdrawSettingRequestAnalysisResultType.APPROVED,
      [this.appJiraCustomFieldUserWithdrawSettingRequestResolutionRejected]:
        UserWithdrawSettingRequestAnalysisResultType.REJECTED,
    };

    const statusMapper = {
      [this.appJiraUserWithdrawSettingRequestStatusClosed]:
        UserWithdrawSettingRequestState.CLOSED,
    };

    // Update a payload.
    const payload = new NotifyUserWithdrawSettingRequestIssueEntity({
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
      userWithdrawSettingRequestId:
        data.issue?.fields?.[
          this.appJiraCustomFieldUserWithdrawSettingRequestId
        ],
      analysisResult:
        analysisResultMapper[
          data.issue?.fields[
            this.appJiraCustomFieldUserWithdrawSettingRequestResolution
          ]?.id
        ],
      assigneeName: data.issue?.fields?.assignee?.displayName,
      creatorName: data.issue?.fields?.creator?.displayName,
      reporterName: data.issue?.fields?.reporter?.displayName,
      issueCreatedAt: data.issue?.fields?.updated,
    });

    logger.debug('Notify update user withdraw setting request issue in jira.', {
      issue_id: params.issue_id,
    });

    // Call api jira service.
    await this.service.notifyUpdateUserWithdrawSettingRequestIssue(
      requestId,
      payload,
    );

    logger.debug('User withdraw setting request issue updated.', { payload });
  }
}
