import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Grant access to endpoints if admin sent email and password.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
