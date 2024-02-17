import { CreateReportUserGateway } from './create_report_user.gateway';
import { CreateReportHolderGateway } from './create_report_holder.gateway';
import { CreateReportUserConfigGateway } from './create_report_user_config.gateway';
import { CreateReportUserRepresentorGateway } from './create_report_user_representor.gateway';
import { CreateReportPaymentsAccountHolderGateway } from './create_report_payments_account_holder.gateway';
import { CreateReportOperationGateway } from './create_report_operation.gateway';
import { SendReportGateway } from './send_report.gateway';

export type ReportGateway = CreateReportUserGateway &
  SendReportGateway &
  CreateReportHolderGateway &
  CreateReportUserConfigGateway &
  CreateReportPaymentsAccountHolderGateway &
  CreateReportUserRepresentorGateway &
  CreateReportOperationGateway;
