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
import {
  PixInfractionStatus,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import { NotifyPixInfractionIssueEntity } from '@zro/api-jira/domain';
import {
  JiraServiceKafka,
  createPixInfractionIssueBodyRest,
} from '@zro/api-jira/infrastructure';

type Issue = {
  fields: FieldType;
};

type FieldType = {
  issuetype: IssueType;
  project: ProjectType;
  created: Date;
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

export class NotifyCreateParams {
  @ApiProperty({
    description: 'ID for issue created in Jira.',
    example: '1234',
  })
  @IsNumber()
  @Transform((params) => params && parseInt(params.value))
  issue_id: number;
}

export class NotifyCreateBody {
  @ApiProperty(createPixInfractionIssueBodyRest)
  @IsObject()
  issue: Issue;
}

interface JiraCustomFieldConfig {
  APP_JIRA_INFRACTION_CUSTOM_FIELD_OPERATION_ID: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_FRAUD: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_REQUEST_REFUND: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_CANCEL_DEVOLUTION: string;
  APP_JIRA_INFRACTION_STATUS_NEW: string;
}

/**
 * Notify create issue controller.
 */
@ApiBearerAuth()
@ApiTags('Issues | Pix Infraction')
@Controller('notify/infraction/created/:issue_id')
export class NotifyCreatePixInfractionIssueRestController {
  private appJiraCustomFieldOperationId: string;
  private appJiraCustomFieldReason: string;
  private appJiraCustomFieldReasonFraud: string;
  private appJiraCustomFieldReasonRequestRefund: string;
  private appJiraCustomFieldReasonCancelDevolution: string;
  private appJiraInfractionStatusNew: string;

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
    this.appJiraInfractionStatusNew = this.configService.get<string>(
      'APP_JIRA_INFRACTION_STATUS_NEW',
    );
  }

  /**
   * NotifyCreate endpoint.
   */
  @ApiOperation({
    description: 'Notify create.',
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
    @Body() data: NotifyCreateBody,
    @Param() params: NotifyCreateParams,
    @RequestId() requestId: string,
    @LoggerParam(NotifyCreatePixInfractionIssueRestController)
    logger: Logger,
  ): Promise<void> {
    const infractionTypeMapper = {
      [this.appJiraCustomFieldReasonRequestRefund]:
        PixInfractionType.REFUND_REQUEST,
      [this.appJiraCustomFieldReasonFraud]: PixInfractionType.FRAUD,
      [this.appJiraCustomFieldReasonCancelDevolution]:
        PixInfractionType.CANCEL_DEVOLUTION,
    };

    const statusMapper = {
      [this.appJiraInfractionStatusNew]: PixInfractionStatus.NEW,
    };

    // Create a payload.
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
      issueCreatedAt: data.issue?.fields?.created,
    });

    logger.debug('Notify create issue in jira.', {
      issue_id: params.issue_id,
    });

    // Call api jira service.
    await this.service.notifyCreatePixInfractionIssue(requestId, payload);

    logger.debug('Issue created.', { payload });
  }
}
