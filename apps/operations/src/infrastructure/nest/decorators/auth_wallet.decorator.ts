import { ApiHeader } from '@nestjs/swagger';
import {
  createParamDecorator,
  ExecutionContext,
  applyDecorators,
  SetMetadata,
} from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { AuthWallet } from '@zro/operations/domain';

export function WalletApiHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'x-wallet-uuid',
      description:
        'Sender Wallet UUID (if empty, your default Wallet UUID will be settled)',
    }),
  );
}

export const NOT_LOAD_AUTH_WALLET_KEY = 'notLoadAuthWallet';

/**
 * NotLoadAuthWallet decorator. Controllers or handlers decorated with
 * @NotLoadAuthWallet data.
 */
export const NotLoadAuthWallet = () =>
  SetMetadata(NOT_LOAD_AUTH_WALLET_KEY, true);

/**
 * Get request auth wallet.
 */
export const AuthWalletParam = createParamDecorator(
  (Class: any, context: ExecutionContext): AuthWallet => {
    let request: any = null;

    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    if (!request.wallet) {
      throw new NullPointerException(
        'Request wallet is not defined. Check if WalletGuard is available or @NotLoadAuthWallet decorator.',
      );
    }

    return request.wallet;
  },
);
