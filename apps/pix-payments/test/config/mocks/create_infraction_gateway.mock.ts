import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  CreateInfractionIssueInfractionResponse,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';

export const success = (): Promise<CreateInfractionIssueInfractionResponse> =>
  Promise.resolve({
    issueId: faker.datatype.number({ min: 1, max: 99999 }),
    key: faker.datatype.string(),
  });

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
