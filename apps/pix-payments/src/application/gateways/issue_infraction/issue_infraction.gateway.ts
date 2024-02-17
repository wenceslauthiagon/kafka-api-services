import { CreateInfractionIssueInfractionGateway } from './create_infraction.gateway';
import { UpdateInfractionIssueInfractionGateway } from './update_infraction.gateway';
import { UpdateInfractionStatusIssueInfractionGateway } from './update_infraction_status.gateway';

export type IssueInfractionGateway = CreateInfractionIssueInfractionGateway &
  UpdateInfractionStatusIssueInfractionGateway &
  UpdateInfractionIssueInfractionGateway;
