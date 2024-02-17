import { Pagination, TPaginationResponse } from '@zro/common';
import {
  WalletInvitation,
  WalletInvitationState,
  Wallet,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export type TGetWalletInvitationsFilter = {
  state?: WalletInvitation['state'];
  acceptedAtPeriodStart?: WalletInvitation['acceptedAt'];
  acceptedAtPeriodEnd?: WalletInvitation['acceptedAt'];
  declinedAtPeriodStart?: WalletInvitation['declinedAt'];
  declinedAtPeriodEnd?: WalletInvitation['declinedAt'];
  expiredAtPeriodStart?: WalletInvitation['expiredAt'];
  expiredAtPeriodEnd?: WalletInvitation['expiredAt'];
  createdAtPeriodStart?: WalletInvitation['createdAt'];
  createdAtPeriodEnd?: WalletInvitation['createdAt'];
};

export interface WalletInvitationRepository {
  /**
   * Create a WalletInvitation.
   *
   * @param WalletInvitation WalletInvitation to be created.
   * @returns Created WalletInvitation.
   */
  create: (WalletInvitation: WalletInvitation) => Promise<WalletInvitation>;

  /**
   * Update a WalletInvitation.
   *
   * @param WalletInvitation WalletInvitation to be updated.
   * @returns Updated WalletInvitation.
   */
  update: (WalletInvitation: WalletInvitation) => Promise<WalletInvitation>;

  /**
   * Get WalletInvitation by id.
   *
   * @param id WalletInvitation id.
   * @returns WalletInvitation found or null otherwise.
   */
  getById: (id: string) => Promise<WalletInvitation>;

  /**
   * Get WalletInvitation by id and user.
   *
   * @param id WalletInvitation id.
   * @param user WalletInvitation user.
   * @returns WalletInvitation found or null otherwise.
   */
  getByIdAndUser: (id: string, user: User) => Promise<WalletInvitation>;

  /**
   * Get all wallet invitations by user and filter.
   *
   * @param pagination Pagination.
   * @param filter TGetWalletInvitationsFilter.
   * @param user User.
   * @returns Pagination response.
   */
  getByUserAndFilter(
    pagination: Pagination,
    filter: TGetWalletInvitationsFilter,
    user: User,
  ): Promise<TPaginationResponse<WalletInvitation>>;

  /**
   * Get all wallet invitations by email, filter and not expired.
   *
   * @param pagination Pagination.
   * @param filter TGetWalletInvitationsFilter.
   * @param email Email from user invited.
   * @returns Pagination response.
   */
  getByEmailAndFilterAndNotExpired(
    pagination: Pagination,
    filter: TGetWalletInvitationsFilter,
    email: string,
  ): Promise<TPaginationResponse<WalletInvitation>>;

  /**
   * Get wallet invitations by email
   * @param email Email from user invited.
   * @returns WalletInvitation.
   */
  getByEmailNotExpired(
    phoneNumber: string,
    email: string,
  ): Promise<WalletInvitation>;

  /**
   * Get wallet invitations by email, wallet and state in
   * @returns WalletInvitation.
   */
  getByEmailAndWalletAndStateIn(
    email: string,
    wallet: Wallet,
    state: WalletInvitationState[],
  ): Promise<WalletInvitation>;

  /**
   * Search by key expiredAt and states.
   * @param {Date} expiredAt Key expiredAt.
   * @param {WalletInvitationState[]} states Wallet invitation states.
   * @return {WalletInvitation[]} Wallet invitations found.
   */
  getByExpiredAtLessThanAndStateIn: (
    expiredAt: Date,
    states: WalletInvitationState[],
  ) => Promise<WalletInvitation[]>;
}
