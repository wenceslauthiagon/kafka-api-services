import { GetAddressByIdService } from './get_address_by_id.service';
import { GetOnboardingByDocumentAndStatusIsFinishedService } from './get_onboarding_by_cpf_and_status_is_finished.service';
import { GetOnboardingByUserAndStatusIsFinishedService } from './get_onboarding_by_user_and_status_is_finished.service';
import { GetUserByDocumentRequestService } from './get_user_by_document.service';
import { GetUserByUuidRequestService } from './get_user_by_uuid.service';

export type UserService = GetAddressByIdService &
  GetUserByUuidRequestService &
  GetOnboardingByUserAndStatusIsFinishedService &
  GetOnboardingByDocumentAndStatusIsFinishedService &
  GetUserByDocumentRequestService;
