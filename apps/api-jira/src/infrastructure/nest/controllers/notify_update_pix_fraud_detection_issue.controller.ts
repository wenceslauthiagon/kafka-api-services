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
import { NotifyPixFraudDetectionIssueEntity } from '@zro/api-jira/domain';
import {
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import {
  JiraServiceKafka,
  updateFraudDetectionRequestIssueBodyRest,
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
type StatusType = { id: string; name: PixFraudDetectionStatus };
type AssigneeType = { displayName: string };
type CreatorType = { displayName: string };
type ReporterType = { displayName: string };

export class NotifyPixFraudDetectionUpdateBody {
  @ApiProperty(updateFraudDetectionRequestIssueBodyRest)
  @IsObject()
  issue: Issue;
}

export class NotifyPixFraudDetectionUpdateParams {
  @ApiProperty({
    description: 'ID for issue updated in Jira.',
    example: '1234',
  })
  @IsNumber()
  @Transform((params) => params && parseInt(params.value))
  issue_id: number;
}

interface JiraCustomFieldConfig {
  APP_JIRA_FRAUD_DETECTION_STATUS_REGISTERED: string;
  APP_JIRA_FRAUD_DETECTION_STATUS_CANCELLED: string;
  APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_DOCUMENT: string;
  APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_KEY: string;
  APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE: string;
  APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE_FALSE_IDENTIFICATION: string;
  APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE_DUMMY_ACCOUNT: string;
  APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE_FRAUDSTER_ACCOUNT: string;
  APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE_OTHER: string;
}

/**
 * Notify update issue controller.
 */
@ApiBearerAuth()
@ApiTags('Issues | Pix Fraud Detection')
@Controller('notify/fraud-detection/updated/:issue_id')
export class NotifyUpdatePixFraudDetectionIssueRestController {
  private appJiraInfractionStatusRegistered: string;
  private appJiraInfractionStatusCancelled: string;
  private appJiraCustomFieldDocument: string;
  private appJiraCustomFieldKey: string;
  private appJiraCustomFieldFraudType: string;
  private appJiraCustomFieldFraudTypeFalseIdentification: string;
  private appJiraCustomFieldFraudTypeDummyAccount: string;
  private appJiraCustomFieldFraudTypeFraudsterAccount: string;
  private appJiraCustomFieldFraudTypeOther: string;

  /**
   * Default constructor.
   * @param service jira service.
   */
  constructor(
    private readonly service: JiraServiceKafka,
    private configService: ConfigService<JiraCustomFieldConfig>,
  ) {
    this.appJiraInfractionStatusRegistered = this.configService.get<string>(
      'APP_JIRA_FRAUD_DETECTION_STATUS_REGISTERED',
    );
    this.appJiraInfractionStatusCancelled = this.configService.get<string>(
      'APP_JIRA_FRAUD_DETECTION_STATUS_CANCELLED',
    );
    this.appJiraCustomFieldDocument = this.configService.get<string>(
      'APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_DOCUMENT',
    );
    this.appJiraCustomFieldKey = this.configService.get<string>(
      'APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_KEY',
    );
    this.appJiraCustomFieldFraudType = this.configService.get<string>(
      'APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE',
    );
    this.appJiraCustomFieldFraudTypeFalseIdentification =
      this.configService.get<string>(
        'APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE_FALSE_IDENTIFICATION',
      );
    this.appJiraCustomFieldFraudTypeDummyAccount =
      this.configService.get<string>(
        'APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE_DUMMY_ACCOUNT',
      );
    this.appJiraCustomFieldFraudTypeFraudsterAccount =
      this.configService.get<string>(
        'APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE_FRAUDSTER_ACCOUNT',
      );
    this.appJiraCustomFieldFraudTypeOther = this.configService.get<string>(
      'APP_JIRA_FRAUD_DETECTION_CUSTOM_FIELD_FRAUD_TYPE_OTHER',
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
    @Body() data: NotifyPixFraudDetectionUpdateBody,
    @Param() params: NotifyPixFraudDetectionUpdateParams,
    @RequestId() requestId: string,
    @LoggerParam(NotifyUpdatePixFraudDetectionIssueRestController)
    logger: Logger,
  ): Promise<void> {
    const fraudDetectionTypeMapper = {
      [this.appJiraCustomFieldFraudTypeFalseIdentification]:
        PixFraudDetectionType.FALSE_IDENTIFICATION,
      [this.appJiraCustomFieldFraudTypeDummyAccount]:
        PixFraudDetectionType.DUMMY_ACCOUNT,
      [this.appJiraCustomFieldFraudTypeFraudsterAccount]:
        PixFraudDetectionType.FRAUDSTER_ACCOUNT,
      [this.appJiraCustomFieldFraudTypeOther]: PixFraudDetectionType.OTHER,
    };

    const statusMapper = {
      [this.appJiraInfractionStatusRegistered]:
        PixFraudDetectionStatus.REGISTERED,
      [this.appJiraInfractionStatusCancelled]:
        PixFraudDetectionStatus.CANCELED_REGISTERED,
    };

    // Update a payload.
    const payload = new NotifyPixFraudDetectionIssueEntity({
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
      assigneeName: data.issue?.fields?.assignee?.displayName,
      creatorName: data.issue?.fields?.creator?.displayName,
      reporterName: data.issue?.fields?.reporter?.displayName,
      issueCreatedAt: data.issue?.fields?.updated,
      fraudType:
        fraudDetectionTypeMapper[
          data.issue?.fields[this.appJiraCustomFieldFraudType]?.id
        ],
      document: data.issue?.fields[this.appJiraCustomFieldDocument],
      key: data.issue?.fields[this.appJiraCustomFieldKey],
    });

    logger.debug('Notify update issue in jira.', {
      issue_id: params.issue_id,
    });

    // Call api jira service.
    await this.service.notifyUpdatePixFraudDetectionIssue(requestId, payload);

    logger.debug('Issue updated.', { payload });
  }
}
