import { GetOnboardingByAccountNumberAndStatusIsFinishedService } from './get_onboarding_by_account_number_and_status_is_finished.service';
import { GetUserByUuidRequestService } from './get_user_by_uuid.service';

export type UserService = GetUserByUuidRequestService &
  GetOnboardingByAccountNumberAndStatusIsFinishedService;
