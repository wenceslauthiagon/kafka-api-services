import { GetPaymentPixStatementGateway } from './get_payment.gateway';
import { GetStatementPixStatementGateway } from './get_statement.gateway';

export type PixStatementGateway = GetStatementPixStatementGateway &
  GetPaymentPixStatementGateway;
