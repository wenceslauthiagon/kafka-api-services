import {
  Address,
  Onboarding,
  User,
  UserLegalRepresentor,
  Occupation,
  UserLegalAdditionalInfo,
} from '@zro/users/domain';

export type CreateReportUser = Pick<
  User,
  | 'uuid'
  | 'fullName'
  | 'phoneNumber'
  | 'document'
  | 'deletedAt'
  | 'updatedAt'
  | 'state'
  | 'email'
  | 'type'
  | 'motherName'
  | 'birthDate'
  | 'genre'
> &
  Pick<
    Address,
    | 'street'
    | 'number'
    | 'city'
    | 'federativeUnit'
    | 'country'
    | 'zipCode'
    | 'complement'
  > &
  Pick<
    UserLegalAdditionalInfo,
    | 'cnae'
    | 'constitutionDesc'
    | 'employeeQty'
    | 'overseasBranchesQty'
    | 'isThirdPartyRelationship'
    | 'isCreditCardAdmin'
    | 'isPatrimonyTrust'
    | 'isPaymentFacilitator'
    | 'isRegulatedPld'
    | 'legalNaturityCode'
  > & {
    onboardingUpdatedAt: Onboarding['updatedAt'];
    onboardingReviewAssignee: Onboarding['reviewAssignee'];
    onboardingPepSince?: Onboarding['pepSince'];
    occupationName?: Occupation['name'];
    id: string;
  };

export type CreateReportUserLegalRepresentor = Omit<
  UserLegalRepresentor,
  'id'
> & {
  id: string;
  userLegalRepresentorId: UserLegalRepresentor['id'];
};

export interface ReportService {
  /**
   * Call Report for creating report for user.
   * @param data The information to send.
   */
  createReportUser(data: CreateReportUser): Promise<void>;

  createReportUserLegalRepresentor(
    data: CreateReportUserLegalRepresentor,
  ): Promise<void>;
}
