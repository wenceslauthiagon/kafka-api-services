import { CreateFraudDetectionPixFraudDetectionPspGateway } from './create_fraud_detection.gateway';
import { GetAllFraudDetectionPixFraudDetectionPspGateway } from './get_all_fraud_detection.gateway';
import { GetByIdFraudDetectionPixFraudDetectionPspGateway } from './get_by_id_fraud_detection.gateway';
import { CancelFraudDetectionPixFraudDetectionPspGateway } from './cancel_fraud_detection.gateway';

export type PixFraudDetectionGateway =
  CreateFraudDetectionPixFraudDetectionPspGateway &
    GetAllFraudDetectionPixFraudDetectionPspGateway &
    GetByIdFraudDetectionPixFraudDetectionPspGateway &
    CancelFraudDetectionPixFraudDetectionPspGateway;
