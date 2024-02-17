import { CreatePixKeyPspGateway } from './create_pix_key.gateway';
import { CreateOwnershipClaimPspGateway } from './create_ownership_claim.gateway';
import { CreatePortabilityClaimPspGateway } from './create_portability_claim.gateway';
import { DeletePixKeyPspGateway } from './delete_pix_key.gateway';
import { CancelPortabilityClaimPspGateway } from './cancel_portability_claim.gateway';
import { ConfirmPortabilityClaimPspGateway } from './confirm_portability_claim.gateway';
import { ClosingClaimPspGateway } from './closing_claim.gateway';
import { DeniedClaimPspGateway } from './denied_claim.gateway';
import { DecodedPixKeyPspGateway } from './decoded_pix_key.gateway';
import { FinishClaimPixKeyPspGateway } from './finish_claim_pix_key.gateway';
import { GetClaimPixKeyPspGateway } from './get_claim_pix_key.gateway';

export type PixKeyGateway = CreatePixKeyPspGateway &
  DeletePixKeyPspGateway &
  CreateOwnershipClaimPspGateway &
  CancelPortabilityClaimPspGateway &
  ConfirmPortabilityClaimPspGateway &
  CreatePortabilityClaimPspGateway &
  ClosingClaimPspGateway &
  DeniedClaimPspGateway &
  DecodedPixKeyPspGateway &
  FinishClaimPixKeyPspGateway &
  GetClaimPixKeyPspGateway;
