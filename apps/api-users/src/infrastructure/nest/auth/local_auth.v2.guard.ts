import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Grant access to endpoints if user sent username and password.
 */
@Injectable()
export class V2LocalAuthGuard extends AuthGuard('v2local') {}
