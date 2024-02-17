import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Grant access to endpoints if clientJdpi is valid
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
