import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  CancelPortabilityClaimPspRequest,
  CancelPortabilityClaimPspResponse,
  ConfirmPortabilityClaimPspRequest,
  ConfirmPortabilityClaimPspResponse,
  CreateOwnershipClaimPspRequest,
  CreateOwnershipClaimPspResponse,
  CreatePixKeyPspRequest,
  CreatePixKeyPspResponse,
  CreatePortabilityClaimPspRequest,
  CreatePortabilityClaimPspResponse,
  DeletePixKeyPspRequest,
  DeletePixKeyPspResponse,
  PixKeyGateway,
  ClosingClaimPspRequest,
  ClosingClaimPspResponse,
  DeniedClaimPspRequest,
  DeniedClaimPspResponse,
  DecodedPixKeyPspRequest,
  DecodedPixKeyPspResponse,
  GetClaimPixKeyPspRequest,
  GetClaimPixKeyPspResponse,
  FinishClaimPixKeyPspRequest,
  FinishClaimPixKeyPspResponse,
} from '@zro/pix-keys/application';
import {
  JdpiCreatePixKeyPspGateway,
  JdpiDeletePixKeyPspGateway,
  JdpiDecodedPixKeyPspGateway,
  JdpiCreateClaimPixKeyPspGateway,
  JdpiGetClaimPixKeyPspGateway,
  JdpiCancelPortabilityPixKeyPspGateway,
  JdpiConfirmPortabilityPixKeyPspGateway,
  JdpiClosingClaimPixKeyPspGateway,
  JdpiDeniedClaimPixKeyPspGateway,
  JdpiFinishClaimPixKeyPspGateway,
} from '@zro/jdpi/infrastructure';

export class JdpiPixKeyGateway implements PixKeyGateway {
  constructor(
    private logger: Logger,
    private jdpiPixKey: AxiosInstance,
  ) {
    this.logger = logger.child({ context: JdpiPixKeyGateway.name });
  }

  async createPixKey(
    request: CreatePixKeyPspRequest,
  ): Promise<CreatePixKeyPspResponse> {
    this.logger.debug('Create pix key request.', { request });

    const gateway = new JdpiCreatePixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.createPixKey(request);
  }

  async deletePixKey(
    request: DeletePixKeyPspRequest,
  ): Promise<DeletePixKeyPspResponse> {
    this.logger.debug('Delete pix key request.', { request });

    const gateway = new JdpiDeletePixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.deletePixKey(request);
  }

  async createOwnershipClaim(
    request: CreateOwnershipClaimPspRequest,
  ): Promise<CreateOwnershipClaimPspResponse> {
    this.logger.debug('Create an ownership claim request.', { request });

    const gateway = new JdpiCreateClaimPixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.createOwnershipClaim(request);
  }

  async createPortabilityClaim(
    request: CreatePortabilityClaimPspRequest,
  ): Promise<CreatePortabilityClaimPspResponse> {
    this.logger.debug('Create a portability claim request.', { request });

    const gateway = new JdpiCreateClaimPixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.createPortabilityClaim(request);
  }

  async confirmPortabilityClaim(
    request: ConfirmPortabilityClaimPspRequest,
  ): Promise<ConfirmPortabilityClaimPspResponse> {
    this.logger.debug('Confirm portability claim request.', { request });

    const gateway = new JdpiConfirmPortabilityPixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.confirmPortabilityClaim(request);
  }

  async cancelPortabilityClaim(
    request: CancelPortabilityClaimPspRequest,
  ): Promise<CancelPortabilityClaimPspResponse> {
    this.logger.debug('Cancel portability claim request.', { request });

    const gateway = new JdpiCancelPortabilityPixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.cancelPortabilityClaim(request);
  }

  async closingClaim(
    request: ClosingClaimPspRequest,
  ): Promise<ClosingClaimPspResponse> {
    this.logger.debug('Closing claim request.', { request });

    const gateway = new JdpiClosingClaimPixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.closingClaim(request);
  }

  async deniedClaim(
    request: DeniedClaimPspRequest,
  ): Promise<DeniedClaimPspResponse> {
    this.logger.debug('Denied claim request.', { request });

    const gateway = new JdpiDeniedClaimPixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.deniedClaim(request);
  }

  async decodePixKey(
    request: DecodedPixKeyPspRequest,
  ): Promise<DecodedPixKeyPspResponse> {
    this.logger.debug('Created DecodedQrCode request.', { request });

    const gateway = new JdpiDecodedPixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.decodePixKey(request);
  }

  finishClaimPixKey(
    request: FinishClaimPixKeyPspRequest,
  ): Promise<FinishClaimPixKeyPspResponse> {
    this.logger.debug('Finish Claim request.', { request });

    const gateway = new JdpiFinishClaimPixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.finishClaimPixKey(request);
  }

  async getClaimPixKey(
    request: GetClaimPixKeyPspRequest,
  ): Promise<GetClaimPixKeyPspResponse> {
    this.logger.debug('Get Claim request.', { request });

    const gateway = new JdpiGetClaimPixKeyPspGateway(
      this.logger,
      this.jdpiPixKey,
    );

    return gateway.getClaimPixKey(request);
  }
}
