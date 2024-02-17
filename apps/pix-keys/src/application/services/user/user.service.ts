import { GetOnboardingByUserAndStatusIsFinishedService } from './get_onboarding_by_user_and_status_is_finished.service';
import { GetUserByUuidRequestService } from './get_user_by_uuid.service';

export type UserService = GetUserByUuidRequestService &
  GetOnboardingByUserAndStatusIsFinishedService;
